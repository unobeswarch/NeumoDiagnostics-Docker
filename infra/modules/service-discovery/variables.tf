# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO SERVICE DISCOVERY - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "namespace_name" {
  description = "Nombre del namespace DNS (ej: neumo.internal)"
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "services" {
  description = "Mapa de servicios a registrar"
  type = map(object({
    port = number
  }))
}

variable "dns_ttl" {
  description = "TTL de los registros DNS (bajo para failover rápido)"
  type        = number
  default     = 10
}

variable "failure_threshold" {
  description = "Número de fallos antes de marcar instancia como unhealthy"
  type        = number
  default     = 1
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

