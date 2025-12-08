# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: MONGODB EN ECS (Alternativa económica a DocumentDB)
# ═══════════════════════════════════════════════════════════════════════════════
# Usa la imagen oficial de MongoDB en un contenedor ECS Fargate
# Costo aproximado: ~$5/mes (vs ~$57/mes de DocumentDB)
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY GROUP
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_security_group" "mongodb" {
  name        = "${var.name_prefix}-mongodb-sg"
  description = "Security group for MongoDB ECS"
  vpc_id      = var.vpc_id

  ingress {
    description = "MongoDB from ECS"
    from_port   = 27017
    to_port     = 27017
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
    Name = "${var.name_prefix}-mongodb-sg"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# ECS TASK DEFINITION
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "mongodb" {
  family                   = "${var.name_prefix}-mongodb"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn           = var.task_role_arn

  container_definitions = jsonencode([
    {
      name  = "mongodb"
      image = "mongo:6.0"  # MongoDB 6.0 oficial
      
      portMappings = [
        {
          containerPort = 27017
          hostPort      = 27017
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "MONGO_INITDB_DATABASE"
          value = var.database_name
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "mongodb"
        }
      }

      essential = true
    }
  ])

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-mongodb-task"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# ECS SERVICE
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_service" "mongodb" {
  name            = "mongodb"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.mongodb.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.mongodb.id]
    assign_public_ip = false
  }

  # Service Discovery para que prediagnostic-be lo encuentre
  dynamic "service_registries" {
    for_each = var.service_discovery_arn != null ? [1] : []
    content {
      registry_arn = var.service_discovery_arn
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-mongodb"
  })
}

