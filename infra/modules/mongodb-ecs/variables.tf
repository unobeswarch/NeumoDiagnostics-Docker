# ═══════════════════════════════════════════════════════════════════════════════
# MONGODB ECS - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "subnet_ids" {
  description = "IDs de subnets privadas"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks permitidos"
  type        = list(string)
}

variable "cluster_id" {
  description = "ID del cluster ECS"
  type        = string
}

variable "execution_role_arn" {
  description = "ARN del rol de ejecución ECS"
  type        = string
}

variable "task_role_arn" {
  description = "ARN del rol de tarea ECS"
  type        = string
}

variable "log_group_name" {
  description = "Nombre del log group de CloudWatch"
  type        = string
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
}

variable "database_name" {
  description = "Nombre de la base de datos"
  type        = string
  default     = "prediagnostic_db"
}

variable "cpu" {
  description = "CPU para la tarea"
  type        = string
  default     = "256"
}

variable "memory" {
  description = "Memoria para la tarea"
  type        = string
  default     = "512"
}

variable "service_discovery_arn" {
  description = "ARN del servicio de Cloud Map"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

