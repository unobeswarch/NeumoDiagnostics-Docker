# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO ALB - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "alb_name" {
  description = "Nombre del ALB"
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "subnet_ids" {
  description = "IDs de las subnets (públicas para ALB externo)"
  type        = list(string)
}

variable "internal" {
  description = "Si el ALB es interno"
  type        = bool
  default     = false
}

variable "allowed_cidr_blocks" {
  description = "CIDRs permitidos para acceso"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_deletion_protection" {
  description = "Protección contra eliminación accidental"
  type        = bool
  default     = false
}

variable "redirect_to_https" {
  description = "Redirigir HTTP a HTTPS"
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ARN del certificado ACM para HTTPS"
  type        = string
  default     = null
}

variable "ssl_policy" {
  description = "Política SSL para HTTPS"
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "access_logs_bucket" {
  description = "Bucket S3 para access logs"
  type        = string
  default     = null
}

variable "deregistration_delay" {
  description = "Tiempo para drenar conexiones al deregistrar target"
  type        = number
  default     = 30
}

variable "target_groups" {
  description = "Mapa de target groups a crear"
  type = map(object({
    port                 = number
    health_check_path    = string
    health_check_matcher = string
    priority             = number
    path_patterns        = optional(list(string))
    host_headers         = optional(list(string))
    stickiness_enabled   = optional(bool, false)
    stickiness_duration  = optional(number, 86400)
  }))
  default = {}
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

