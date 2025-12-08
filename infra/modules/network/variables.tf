# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO NETWORK - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block para la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Lista de zonas de disponibilidad"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDRs para subnets públicas"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDRs para subnets privadas"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Habilitar NAT Gateway"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Usar un solo NAT Gateway (ahorro de costos)"
  type        = bool
  default     = false
}

variable "enable_vpc_endpoints" {
  description = "Habilitar VPC Endpoints para S3, ECR, CloudWatch"
  type        = bool
  default     = false
}

variable "enable_flow_logs" {
  description = "Habilitar VPC Flow Logs"
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

