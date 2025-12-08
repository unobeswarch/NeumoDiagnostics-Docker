# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO ECR - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de repositorios"
  type        = string
}

variable "repository_names" {
  description = "Lista de nombres de repositorios a crear"
  type        = list(string)
}

variable "image_tag_mutability" {
  description = "Mutabilidad de tags (MUTABLE o IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Escanear imágenes al hacer push"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "ARN de llave KMS para encriptación"
  type        = string
  default     = null
}

variable "keep_image_count" {
  description = "Número de imágenes tagueadas a conservar"
  type        = number
  default     = 30
}

variable "untagged_expiry_days" {
  description = "Días antes de expirar imágenes sin tag"
  type        = number
  default     = 7
}

variable "cross_account_arns" {
  description = "ARNs de cuentas con acceso cross-account"
  type        = list(string)
  default     = null
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

