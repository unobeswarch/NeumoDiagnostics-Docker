# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: RABBITMQ EN ECS FARGATE
# ═══════════════════════════════════════════════════════════════════════════════
# Despliega RabbitMQ como contenedor en ECS Fargate
# Alternativa simple y económica a Amazon MQ
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY GROUP
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_security_group" "rabbitmq" {
  name        = "${var.name_prefix}-rabbitmq-sg"
  description = "Security group for RabbitMQ ECS service"
  vpc_id      = var.vpc_id

  # AMQP port
  ingress {
    description = "AMQP from private subnets"
    from_port   = 5672
    to_port     = 5672
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # Management UI (optional)
  ingress {
    description = "RabbitMQ Management UI"
    from_port   = 15672
    to_port     = 15672
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-rabbitmq-sg"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# ECS TASK DEFINITION
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "rabbitmq" {
  family                   = "${var.name_prefix}-rabbitmq"
  cpu                      = var.cpu
  memory                   = var.memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

      container_definitions = jsonencode([
    {
      name      = "rabbitmq"
      image     = "rabbitmq:3-management"
      cpu       = var.cpu
      memory    = var.memory
      essential = true

      # Run as root to avoid permission issues with erlang cookie
      user = "0:0"

      portMappings = [
        {
          containerPort = 5672
          hostPort      = 5672
          protocol      = "tcp"
        },
        {
          containerPort = 15672
          hostPort      = 15672
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "RABBITMQ_DEFAULT_USER"
          value = var.rabbitmq_user
        },
        {
          name  = "RABBITMQ_DEFAULT_PASS"
          value = var.rabbitmq_password
        },
        {
          # Set erlang cookie to avoid file permission issues
          name  = "RABBITMQ_ERLANG_COOKIE"
          value = "neumo-rabbitmq-secret-cookie"
        },
        {
          # Use NODENAME to avoid hostname issues
          name  = "RABBITMQ_NODENAME"
          value = "rabbit@localhost"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "rabbitmq-diagnostics -q check_running"]
        interval    = 30
        timeout     = 10
        retries     = 5
        startPeriod = 120
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "rabbitmq"
        }
      }
    }
  ])

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-rabbitmq-task"
    Service = "rabbitmq"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# ECS SERVICE
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_service" "rabbitmq" {
  name            = "rabbitmq"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.rabbitmq.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.rabbitmq.id]
    assign_public_ip = false
  }

  # Service Discovery for internal DNS
  service_registries {
    registry_arn = var.service_discovery_arn
  }

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-rabbitmq"
    Service = "rabbitmq"
  })
}
