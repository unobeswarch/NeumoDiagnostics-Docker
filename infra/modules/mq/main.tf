# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: AMAZON MQ FOR RABBITMQ
# ═══════════════════════════════════════════════════════════════════════════════
# Reemplaza el message-broker (RabbitMQ) del docker-compose
# Implementa alta disponibilidad con Active/Standby Multi-AZ
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY GROUP PARA AMAZON MQ
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_security_group" "mq" {
  name        = "${var.name_prefix}-mq-sg"
  description = "Security group for Amazon MQ RabbitMQ"
  vpc_id      = var.vpc_id

  # AMQP
  ingress {
    description     = "AMQP from ECS"
    from_port       = 5671
    to_port         = 5671
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
    cidr_blocks     = var.allowed_cidr_blocks
  }

  # AMQPS (TLS)
  ingress {
    description     = "AMQPS from ECS"
    from_port       = 5672
    to_port         = 5672
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
    cidr_blocks     = var.allowed_cidr_blocks
  }

  # Management Console (HTTPS)
  ingress {
    description     = "RabbitMQ Management"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
    cidr_blocks     = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-mq-sg"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# AMAZON MQ BROKER
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_mq_broker" "main" {
  broker_name = "${var.name_prefix}-${var.broker_name}"

  engine_type                = "RabbitMQ"
  engine_version             = var.engine_version
  host_instance_type         = var.instance_type
  auto_minor_version_upgrade = true  # Requerido para RabbitMQ 3.13+
  
  # ═══════════════════════════════════════════════════════════════════════════
  # ALTA DISPONIBILIDAD: Active/Standby Multi-AZ
  # Similar al patrón Warm Spare del Escenario 4
  # ═══════════════════════════════════════════════════════════════════════════
  deployment_mode = var.deployment_mode

  # Security
  publicly_accessible = false
  security_groups     = [aws_security_group.mq.id]
  subnet_ids          = var.deployment_mode == "SINGLE_INSTANCE" ? [var.subnet_ids[0]] : var.subnet_ids

  # Authentication
  user {
    username = var.mq_username
    password = var.mq_password
  }

  # Logs
  logs {
    general = var.enable_general_logs
  }

  # Maintenance
  maintenance_window_start_time {
    day_of_week = var.maintenance_day
    time_of_day = var.maintenance_time
    time_zone   = "UTC"
  }

  # Encryption
  encryption_options {
    use_aws_owned_key = var.kms_key_arn == null
    kms_key_id        = var.kms_key_arn
  }

  tags = merge(var.tags, {
    Name           = "${var.name_prefix}-${var.broker_name}"
    Pattern        = var.deployment_mode == "ACTIVE_STANDBY_MULTI_AZ" ? "WarmSpare" : "SingleInstance"
    DeploymentMode = var.deployment_mode
  })
}

