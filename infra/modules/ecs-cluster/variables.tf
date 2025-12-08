# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO ECS CLUSTER - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "enable_container_insights" {
  description = "Habilitar Container Insights para monitoreo"
  type        = bool
  default     = true
}

variable "fargate_base_count" {
  description = "Número base de tareas en Fargate regular (no Spot)"
  type        = number
  default     = 2
}

variable "fargate_spot_weight" {
  description = "Peso para Fargate Spot (0 = deshabilitado)"
  type        = number
  default     = 1
}

variable "log_retention_days" {
  description = "Días de retención de logs en CloudWatch"
  type        = number
  default     = 30
}

variable "enable_xray" {
  description = "Habilitar AWS X-Ray para trazabilidad"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

