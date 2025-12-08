# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: ECS SERVICE
# ═══════════════════════════════════════════════════════════════════════════════
# Módulo reutilizable para servicios ECS Fargate
# Implementa:
#   - Escenario 1: Hot Spare (múltiples tareas con ALB)
#   - Escenario 2: Service Discovery (registro en Cloud Map)
#   - Escenario 3: Cluster Pattern (distribución Multi-AZ con autoscaling)
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# TASK DEFINITION
# Define la configuración del contenedor (CPU, memoria, imagen, etc.)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.name_prefix}-${var.service_name}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn           = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = var.service_name
      image     = var.container_image
      essential = true

      # Configuración de puertos
      portMappings = var.container_port != null ? [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ] : []

      # Variables de entorno
      environment = var.environment_variables

      # Secretos desde Secrets Manager o Parameter Store
      secrets = var.secrets

      # Configuración de logs
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = var.service_name
        }
      }

      # Health check del contenedor
      healthCheck = var.health_check_command != null ? {
        command     = var.health_check_command
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = var.health_check_start_period
      } : null

      # Límites de recursos
      ulimits = [
        {
          name      = "nofile"
          softLimit = 65536
          hardLimit = 65536
        }
      ]
    }
  ])

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-${var.service_name}-task"
    Service = var.service_name
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY GROUP PARA EL SERVICIO
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_security_group" "service" {
  name        = "${var.name_prefix}-${var.service_name}-sg"
  description = "Security group for ${var.service_name} service"
  vpc_id      = var.vpc_id

  # Ingreso desde ALB o desde otros servicios internos
  dynamic "ingress" {
    for_each = var.container_port != null ? [1] : []
    content {
      description     = "Traffic from ALB/Internal"
      from_port       = var.container_port
      to_port         = var.container_port
      protocol        = "tcp"
      security_groups = var.allowed_security_groups
      cidr_blocks     = var.allowed_cidr_blocks
    }
  }

  # Egreso a internet (para APIs externas, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-${var.service_name}-sg"
    Service = var.service_name
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# ECS SERVICE
# ═══════════════════════════════════════════════════════════════════════════
# Escenario 1 (Hot Spare): desired_count >= 2 distribuido en múltiples AZs
# Escenario 2 (Service Discovery): registro automático en Cloud Map
# Escenario 3 (Cluster): placement_constraints distribuyen tareas
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_service" "main" {
  name            = var.service_name
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.main.arn
  
  # ═══════════════════════════════════════════════════════════════════════════
  # ESCENARIO 1: HOT SPARE
  # Múltiples tareas activas procesando tráfico en paralelo
  # ═══════════════════════════════════════════════════════════════════════════
  desired_count = var.desired_count
  launch_type   = "FARGATE"

  # Configuración de red - distribución en múltiples subnets (AZs)
  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.service.id]
    assign_public_ip = var.assign_public_ip
  }

  # Configuración de despliegue sin downtime
  deployment_maximum_percent         = 200  # Permite duplicar tareas durante deploy
  deployment_minimum_healthy_percent = var.minimum_healthy_percent  # Mantiene disponibilidad

  deployment_circuit_breaker {
    enable   = true
    rollback = true  # Rollback automático si falla el deploy
  }

  # ═══════════════════════════════════════════════════════════════════════════
  # ESCENARIO 2: SERVICE DISCOVERY
  # Registro automático en AWS Cloud Map
  # ═══════════════════════════════════════════════════════════════════════════
  dynamic "service_registries" {
    for_each = var.service_discovery_arn != null ? [1] : []
    content {
      registry_arn   = var.service_discovery_arn
      container_name = var.service_name
      # container_port no se necesita con awsvpc network mode
    }
  }

  # ═══════════════════════════════════════════════════════════════════════════
  # INTEGRACIÓN CON ALB (para servicios públicos/balanceados)
  # ═══════════════════════════════════════════════════════════════════════════
  dynamic "load_balancer" {
    for_each = var.target_group_arn != null ? [1] : []
    content {
      target_group_arn = var.target_group_arn
      container_name   = var.service_name
      container_port   = var.container_port
    }
  }

  # Health check grace period (tiempo para que el contenedor arranque)
  health_check_grace_period_seconds = var.target_group_arn != null ? var.health_check_grace_period : null

  # Evitar recreación al cambiar task definition (se actualiza con deploy)
  lifecycle {
    ignore_changes = [task_definition]
  }

  # Esperar a que el ALB esté listo
  depends_on = [var.alb_listener_arn]

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-${var.service_name}"
    Service = var.service_name
    Pattern = var.desired_count >= 2 ? "HotSpare" : "Standard"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# AUTO SCALING
# ═══════════════════════════════════════════════════════════════════════════
# Escenario 3: Cluster Pattern con auto-scaling
# Mantiene N+1 redundancia y escala según demanda
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_appautoscaling_target" "main" {
  count = var.enable_autoscaling ? 1 : 0

  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${var.cluster_name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Política de escalado basada en CPU
resource "aws_appautoscaling_policy" "cpu" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "${var.name_prefix}-${var.service_name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main[0].resource_id
  scalable_dimension = aws_appautoscaling_target.main[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.main[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = var.cpu_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown
  }
}

# Política de escalado basada en memoria
resource "aws_appautoscaling_policy" "memory" {
  count = var.enable_autoscaling && var.enable_memory_scaling ? 1 : 0

  name               = "${var.name_prefix}-${var.service_name}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main[0].resource_id
  scalable_dimension = aws_appautoscaling_target.main[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.main[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    target_value       = var.memory_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown
  }
}

# Política de escalado basada en requests del ALB (para servicios con ALB)
resource "aws_appautoscaling_policy" "requests" {
  # Usamos alb_resource_label que es un string conocido en plan-time
  count = var.enable_autoscaling && var.alb_resource_label != null ? 1 : 0

  name               = "${var.name_prefix}-${var.service_name}-requests-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main[0].resource_id
  scalable_dimension = aws_appautoscaling_target.main[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.main[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = var.alb_resource_label
    }

    target_value       = var.requests_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown
  }
}

