# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: RDS POSTGRESQL
# ═══════════════════════════════════════════════════════════════════════════════
# Implementa el Escenario 4: Warm Spare (Database Failover)
# RDS Multi-AZ con failover automático
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY GROUP PARA RDS
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  # Solo permite tráfico desde los servicios ECS
  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
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
    Name = "${var.name_prefix}-rds-sg"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# DB SUBNET GROUP
# Define las subnets donde RDS puede crear instancias
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name        = "${var.name_prefix}-db-subnet-group"
  description = "Subnet group for RDS instances"
  subnet_ids  = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# DB PARAMETER GROUP
# Configuración de PostgreSQL optimizada
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_db_parameter_group" "main" {
  name        = "${var.name_prefix}-pg-params"
  family      = "postgres${var.engine_version_major}"
  description = "Parameter group for ${var.name_prefix}"

  # Parámetros optimizados
  parameter {
    name  = "log_statement"
    value = var.log_statement
  }

  parameter {
    name  = "log_min_duration_statement"
    value = var.log_min_duration_statement
  }

  tags = var.tags
}

# ─────────────────────────────────────────────────────────────────────────────
# IAM ROLE PARA ENHANCED MONITORING
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name = "${var.name_prefix}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ─────────────────────────────────────────────────────────────────────────────
# RDS INSTANCE
# ═══════════════════════════════════════════════════════════════════════════
# ESCENARIO 4: WARM SPARE (FAILOVER PATTERN)
# multi_az = true crea una instancia standby en otra AZ
# En caso de fallo, AWS promueve el standby automáticamente
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-${var.db_identifier}"

  # Engine
  engine               = "postgres"
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  parameter_group_name = aws_db_parameter_group.main.name

  # Storage
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = true
  kms_key_id           = var.kms_key_arn

  # Database
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  # ═══════════════════════════════════════════════════════════════════════════
  # WARM SPARE: MULTI-AZ DEPLOYMENT
  # Crea una réplica sincrónica en otra AZ
  # Failover automático en ~60-120 segundos
  # ═══════════════════════════════════════════════════════════════════════════
  multi_az = var.multi_az

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  # Performance & Monitoring
  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? 7 : null
  monitoring_interval                   = var.monitoring_interval
  monitoring_role_arn                   = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  # Logging
  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  # Protection
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name_prefix}-${var.db_identifier}-final"
  copy_tags_to_snapshot    = true

  # Auto minor version upgrades
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  tags = merge(var.tags, {
    Name           = "${var.name_prefix}-${var.db_identifier}"
    Pattern        = "WarmSpare"
    FailoverType   = "AutomaticMultiAZ"
    Scenario       = "4-DatabaseFailover"
    ActiveInstance = "Primary"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# CLOUDWATCH ALARMS PARA RDS
# Alertas de salud y rendimiento
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is too high"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "storage_low" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.name_prefix}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120  # 5GB in bytes
  alarm_description   = "RDS free storage space is too low"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

