# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO S3 - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de buckets"
  type        = string
}

variable "account_id" {
  description = "ID de la cuenta AWS (para nombres únicos)"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN de llave KMS para encriptación"
  type        = string
  default     = null
}

# Radiographs bucket
variable "radiograph_archive_days" {
  description = "Días antes de archivar radiografías a Glacier"
  type        = number
  default     = 90
}

variable "radiograph_expiry_days" {
  description = "Días antes de eliminar radiografías"
  type        = number
  default     = 365
}

# Logs bucket
variable "create_logs_bucket" {
  description = "Crear bucket para logs"
  type        = bool
  default     = true
}

variable "log_expiry_days" {
  description = "Días antes de eliminar logs"
  type        = number
  default     = 90
}

# ELB account ID para policy de logs (varía por región)
variable "elb_account_id" {
  description = "Account ID de ELB para la región"
  type        = string
  default     = "127311923021"  # us-east-1
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

