# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - ENVIRONMENT: DEVELOPMENT
# ═══════════════════════════════════════════════════════════════════════════════
# Configuración optimizada para desarrollo con costos reducidos
# ═══════════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend local para desarrollo
  # Para producción, usar S3 + DynamoDB
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "NeumoDiagnostics"
      Environment = "dev"
      ManagedBy   = "Terraform"
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────
module "neumo" {
  source = "../../"

  # General
  project_name = "neumo"
  environment  = "dev"
  aws_region   = var.aws_region

  # Networking (ahorro de costos: un solo NAT Gateway)
  vpc_cidr             = "10.0.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = true  # Un solo NAT para ahorrar ~$45/mes

  # ECS
  enable_container_insights = false  # Deshabilitado para ahorrar

  # Servicios (recursos mínimos para desarrollo)
  api_gateway_desired_count = 2
  api_gateway_cpu           = 256
  api_gateway_memory        = 512
  api_gateway_min_capacity  = 1
  api_gateway_max_capacity  = 3

  auth_be_desired_count = 1
  auth_be_cpu           = 256
  auth_be_memory        = 512

  prediagnostic_be_desired_count = 2
  prediagnostic_be_cpu           = 512
  prediagnostic_be_memory        = 1024
  prediagnostic_min_capacity     = 2
  prediagnostic_max_capacity     = 4

  notification_be_desired_count = 1
  notification_be_cpu           = 256
  notification_be_memory        = 512

  message_producer_desired_count = 1
  message_producer_cpu           = 256
  message_producer_memory        = 512

  web_frontend_desired_count = 1
  web_frontend_cpu           = 256
  web_frontend_memory        = 512

  # RDS (instancia pequeña, Multi-AZ deshabilitado para dev)
  rds_instance_class        = "db.t3.micro"
  rds_allocated_storage     = 20
  rds_max_allocated_storage = 50
  rds_multi_az             = false  # Sin Multi-AZ para ahorrar ~$30/mes

  # DocumentDB (instancia pequeña, una sola réplica)
  docdb_instance_class = "db.t3.medium"
  docdb_instance_count = 1  # Solo 1 instancia para dev

  # Amazon MQ (instancia pequeña, single instance)
  mq_instance_type   = "mq.t3.micro"
  mq_deployment_mode = "SINGLE_INSTANCE"

  # Credenciales (desde variables de entorno)
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  docdb_master_username = var.docdb_master_username
  docdb_master_password = var.docdb_master_password
  mq_username          = var.mq_username
  mq_password          = var.mq_password
  smtp_username        = var.smtp_username
  smtp_password        = var.smtp_password
  smtp_host            = "smtp.mailgun.org"
  smtp_port            = 587
  email_from           = "dev@neudiagnostics.local"

  # Sin dominio personalizado en dev
  domain_name = ""
}

# ─────────────────────────────────────────────────────────────────────────────
# VARIABLES
# ─────────────────────────────────────────────────────────────────────────────
variable "aws_region" {
  default = "us-east-1"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "auth_db"
}

variable "db_username" {
  description = "RDS username"
  type        = string
  default     = "neumo_dev"
}

variable "db_password" {
  description = "RDS password"
  type        = string
  sensitive   = true
}

variable "docdb_master_username" {
  description = "DocumentDB username"
  type        = string
  default     = "neumo_docdb"
}

variable "docdb_master_password" {
  description = "DocumentDB password"
  type        = string
  sensitive   = true
}

variable "mq_username" {
  description = "RabbitMQ username"
  type        = string
  default     = "neumo_mq"
}

variable "mq_password" {
  description = "RabbitMQ password"
  type        = string
  sensitive   = true
}

variable "smtp_username" {
  description = "SMTP username"
  type        = string
  default     = ""
}

variable "smtp_password" {
  description = "SMTP password"
  type        = string
  sensitive   = true
  default     = ""
}

# ─────────────────────────────────────────────────────────────────────────────
# OUTPUTS
# ─────────────────────────────────────────────────────────────────────────────
output "application_url" {
  description = "URL de la aplicación"
  value       = module.neumo.application_url
}

output "ecr_repositories" {
  description = "URLs de repositorios ECR"
  value       = module.neumo.ecr_repository_urls
}

output "patterns_summary" {
  description = "Resumen de patrones implementados"
  value       = module.neumo.availability_patterns_summary
}

