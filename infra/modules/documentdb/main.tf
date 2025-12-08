# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: AMAZON DOCUMENTDB (MongoDB Compatible)
# ═══════════════════════════════════════════════════════════════════════════════
# Reemplaza MongoDB del docker-compose
# Implementa replicación para alta disponibilidad
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# SECURITY GROUP PARA DOCUMENTDB
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_security_group" "docdb" {
  name        = "${var.name_prefix}-docdb-sg"
  description = "Security group for DocumentDB cluster"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MongoDB from ECS"
    from_port       = 27017
    to_port         = 27017
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
    Name = "${var.name_prefix}-docdb-sg"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# SUBNET GROUP
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_docdb_subnet_group" "main" {
  name        = "${var.name_prefix}-docdb-subnet-group"
  description = "Subnet group for DocumentDB"
  subnet_ids  = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-docdb-subnet-group"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# PARAMETER GROUP
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_docdb_cluster_parameter_group" "main" {
  name        = "${var.name_prefix}-docdb-params"
  family      = var.parameter_family
  description = "Parameter group for ${var.name_prefix}"

  parameter {
    name  = "tls"
    value = var.enable_tls ? "enabled" : "disabled"
  }

  parameter {
    name  = "audit_logs"
    value = var.enable_audit_logs ? "enabled" : "disabled"
  }

  tags = var.tags
}

# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTDB CLUSTER
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_docdb_cluster" "main" {
  cluster_identifier = "${var.name_prefix}-${var.cluster_identifier}"

  # Engine
  engine         = "docdb"
  engine_version = var.engine_version

  # Credentials
  master_username = var.master_username
  master_password = var.master_password

  # Networking
  db_subnet_group_name            = aws_docdb_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.docdb.id]
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name

  # Backup
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = var.backup_window

  # Maintenance
  preferred_maintenance_window = var.maintenance_window

  # Encryption
  storage_encrypted = true
  kms_key_id       = var.kms_key_arn

  # Logging
  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  # Protection
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name_prefix}-${var.cluster_identifier}-final"

  tags = merge(var.tags, {
    Name     = "${var.name_prefix}-${var.cluster_identifier}"
    Pattern  = "Cluster"
    Scenario = "3-ClusterPattern"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTDB INSTANCES
# Múltiples instancias para alta disponibilidad y read scaling
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_docdb_cluster_instance" "main" {
  count = var.instance_count

  identifier         = "${var.name_prefix}-${var.cluster_identifier}-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class

  # Auto minor version upgrade
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  tags = merge(var.tags, {
    Name     = "${var.name_prefix}-${var.cluster_identifier}-${count.index + 1}"
    Role     = count.index == 0 ? "Primary" : "Replica"
    Index    = count.index
    Pattern  = "Cluster"
    Scenario = "3-ClusterPattern"
  })
}

