# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO AMAZON MQ - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "broker_name" {
  description = "Nombre del broker"
  type        = string
  default     = "rabbitmq"
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
  description = "Versión del motor RabbitMQ"
  type        = string
  default     = "3.13"  # Valid versions: 3.13, 4.2
}

variable "instance_type" {
  description = "Tipo de instancia"
  type        = string
  default     = "mq.t3.micro"
}

# Deployment
variable "deployment_mode" {
  description = "Modo de despliegue (SINGLE_INSTANCE o ACTIVE_STANDBY_MULTI_AZ)"
  type        = string
  default     = "SINGLE_INSTANCE"

  validation {
    condition     = contains(["SINGLE_INSTANCE", "ACTIVE_STANDBY_MULTI_AZ"], var.deployment_mode)
    error_message = "Deployment mode debe ser SINGLE_INSTANCE o ACTIVE_STANDBY_MULTI_AZ."
  }
}

# Authentication
variable "mq_username" {
  description = "Usuario de RabbitMQ"
  type        = string
  sensitive   = true
}

variable "mq_password" {
  description = "Contraseña de RabbitMQ"
  type        = string
  sensitive   = true
}

# Logging
variable "enable_general_logs" {
  description = "Habilitar logs generales"
  type        = bool
  default     = true
}

# Maintenance
variable "maintenance_day" {
  description = "Día de mantenimiento"
  type        = string
  default     = "SUNDAY"
}

variable "maintenance_time" {
  description = "Hora de mantenimiento (UTC)"
  type        = string
  default     = "04:00"
}

# Encryption
variable "kms_key_arn" {
  description = "ARN de llave KMS"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

