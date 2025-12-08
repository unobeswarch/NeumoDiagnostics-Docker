# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO RDS - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "db_identifier" {
  description = "Identificador de la instancia RDS"
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "subnet_ids" {
  description = "IDs de las subnets privadas"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security groups permitidos para conexión"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks permitidos para conexión"
  type        = list(string)
  default     = []
}

# Engine
variable "engine_version" {
  description = "Versión del motor PostgreSQL"
  type        = string
  default     = "15.10"  # Versión LTS disponible
}

variable "engine_version_major" {
  description = "Versión mayor del motor (para parameter group)"
  type        = string
  default     = "15"
}

variable "instance_class" {
  description = "Clase de instancia RDS"
  type        = string
  default     = "db.t3.medium"
}

# Storage
variable "allocated_storage" {
  description = "Almacenamiento asignado en GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Almacenamiento máximo para autoscaling"
  type        = number
  default     = 100
}

variable "storage_type" {
  description = "Tipo de almacenamiento"
  type        = string
  default     = "gp3"
}

variable "kms_key_arn" {
  description = "ARN de la llave KMS para encriptación"
  type        = string
  default     = null
}

# Database
variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
}

variable "db_username" {
  description = "Usuario maestro"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Contraseña del usuario maestro"
  type        = string
  sensitive   = true
}

# High Availability (Escenario 4: Warm Spare)
variable "multi_az" {
  description = "Habilitar Multi-AZ para failover automático"
  type        = bool
  default     = true
}

# Backup
variable "backup_retention_period" {
  description = "Días de retención de backups (1 para Free Tier)"
  type        = number
  default     = 1  # Free Tier solo permite 1 día
}

variable "backup_window" {
  description = "Ventana de backup (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Ventana de mantenimiento (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# Monitoring
variable "performance_insights_enabled" {
  description = "Habilitar Performance Insights"
  type        = bool
  default     = true
}

variable "monitoring_interval" {
  description = "Intervalo de Enhanced Monitoring (0 = deshabilitado)"
  type        = number
  default     = 60
}

variable "enabled_cloudwatch_logs_exports" {
  description = "Logs a exportar a CloudWatch"
  type        = list(string)
  default     = ["postgresql", "upgrade"]
}

variable "create_cloudwatch_alarms" {
  description = "Crear alarmas de CloudWatch"
  type        = bool
  default     = true
}

# Parameter Group
variable "log_statement" {
  description = "Nivel de logging de statements"
  type        = string
  default     = "all"
}

variable "log_min_duration_statement" {
  description = "Duración mínima para loguear statements (ms)"
  type        = string
  default     = "1000"
}

# Protection
variable "deletion_protection" {
  description = "Protección contra eliminación"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Omitir snapshot final al eliminar"
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Actualizar versiones menores automáticamente"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

