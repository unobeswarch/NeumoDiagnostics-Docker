# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO DOCUMENTDB - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "cluster_identifier" {
  description = "Identificador del cluster"
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
  description = "Security groups permitidos"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks permitidos"
  type        = list(string)
  default     = []
}

# Engine
variable "engine_version" {
  description = "Versión del motor DocumentDB"
  type        = string
  default     = "5.0.0"
}

variable "parameter_family" {
  description = "Familia de parámetros"
  type        = string
  default     = "docdb5.0"
}

# Instance
variable "instance_class" {
  description = "Clase de instancia"
  type        = string
  default     = "db.t3.medium"
}

variable "instance_count" {
  description = "Número de instancias (1 primary + N-1 replicas)"
  type        = number
  default     = 2
}

# Credentials
variable "master_username" {
  description = "Usuario maestro"
  type        = string
  sensitive   = true
}

variable "master_password" {
  description = "Contraseña del usuario maestro"
  type        = string
  sensitive   = true
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

# Security
variable "enable_tls" {
  description = "Habilitar TLS"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "ARN de llave KMS para encriptación"
  type        = string
  default     = null
}

# Logging
variable "enable_audit_logs" {
  description = "Habilitar audit logs"
  type        = bool
  default     = false
}

variable "enabled_cloudwatch_logs_exports" {
  description = "Logs a exportar a CloudWatch"
  type        = list(string)
  default     = ["audit", "profiler"]
}

# Protection
variable "deletion_protection" {
  description = "Protección contra eliminación"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Omitir snapshot final"
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

