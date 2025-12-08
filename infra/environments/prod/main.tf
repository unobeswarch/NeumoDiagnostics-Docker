# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - ENVIRONMENT: PRODUCTION
# ═══════════════════════════════════════════════════════════════════════════════
# Configuración optimizada para producción con alta disponibilidad
# Implementa todos los patrones de disponibilidad completos
# ═══════════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend S3 para estado remoto (producción)
  backend "s3" {
    bucket         = "neumo-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "neumo-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "NeumoDiagnostics"
      Environment = "prod"
      ManagedBy   = "Terraform"
      CostCenter  = "Production"
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
  environment  = "prod"
  aws_region   = var.aws_region

  # Networking (Multi-AZ completo)
  vpc_cidr             = "10.0.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = false  # NAT Gateway por AZ para HA

  # ECS
  enable_container_insights = true

  # ═══════════════════════════════════════════════════════════════════════════
  # ESCENARIO 1: HOT SPARE - API Gateway
  # 3 tareas activas con balanceo de carga
  # ═══════════════════════════════════════════════════════════════════════════
  api_gateway_desired_count = 3
  api_gateway_cpu           = 512
  api_gateway_memory        = 1024
  api_gateway_min_capacity  = 2
  api_gateway_max_capacity  = 6

  # ═══════════════════════════════════════════════════════════════════════════
  # ESCENARIO 2: SERVICE DISCOVERY
  # Todos los servicios registrados en Cloud Map
  # ═══════════════════════════════════════════════════════════════════════════
  auth_be_desired_count = 2
  auth_be_cpu           = 256
  auth_be_memory        = 512

  # ═══════════════════════════════════════════════════════════════════════════
  # ESCENARIO 3: CLUSTER PATTERN - Prediagnostic
  # N+1 redundancia con autoscaling
  # ═══════════════════════════════════════════════════════════════════════════
  prediagnostic_be_desired_count = 4
  prediagnostic_be_cpu           = 1024
  prediagnostic_be_memory        = 2048
  prediagnostic_min_capacity     = 4
  prediagnostic_max_capacity     = 10

  notification_be_desired_count = 2
  notification_be_cpu           = 256
  notification_be_memory        = 512

  message_producer_desired_count = 2
  message_producer_cpu           = 256
  message_producer_memory        = 512

  web_frontend_desired_count = 2
  web_frontend_cpu           = 512
  web_frontend_memory        = 1024

  # ═══════════════════════════════════════════════════════════════════════════
  # ESCENARIO 4: WARM SPARE - RDS Multi-AZ
  # Failover automático entre AZs
  # ═══════════════════════════════════════════════════════════════════════════
  rds_instance_class        = "db.t3.medium"
  rds_allocated_storage     = 50
  rds_max_allocated_storage = 200
  rds_multi_az             = true  # WARM SPARE HABILITADO

  # DocumentDB (cluster con réplicas)
  docdb_instance_class = "db.t3.medium"
  docdb_instance_count = 2  # 1 primary + 1 replica

  # Amazon MQ (Active/Standby Multi-AZ)
  mq_instance_type   = "mq.t3.micro"
  mq_deployment_mode = "ACTIVE_STANDBY_MULTI_AZ"

  # Credenciales (desde Secrets Manager en producción)
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  docdb_master_username = var.docdb_master_username
  docdb_master_password = var.docdb_master_password
  mq_username          = var.mq_username
  mq_password          = var.mq_password
  smtp_username        = var.smtp_username
  smtp_password        = var.smtp_password
  smtp_host            = var.smtp_host
  smtp_port            = 587
  email_from           = var.email_from

  # Dominio personalizado
  domain_name = var.domain_name
}

# ─────────────────────────────────────────────────────────────────────────────
# VARIABLES
# ─────────────────────────────────────────────────────────────────────────────
variable "aws_region" {
  default = "us-east-1"
}

variable "domain_name" {
  description = "Dominio de la aplicación"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "auth_db"
}

variable "db_username" {
  description = "RDS username"
  type        = string
}

variable "db_password" {
  description = "RDS password"
  type        = string
  sensitive   = true
}

variable "docdb_master_username" {
  description = "DocumentDB username"
  type        = string
}

variable "docdb_master_password" {
  description = "DocumentDB password"
  type        = string
  sensitive   = true
}

variable "mq_username" {
  description = "RabbitMQ username"
  type        = string
}

variable "mq_password" {
  description = "RabbitMQ password"
  type        = string
  sensitive   = true
}

variable "smtp_host" {
  description = "SMTP host"
  type        = string
}

variable "smtp_username" {
  description = "SMTP username"
  type        = string
}

variable "smtp_password" {
  description = "SMTP password"
  type        = string
  sensitive   = true
}

variable "email_from" {
  description = "Email remitente"
  type        = string
}

# ─────────────────────────────────────────────────────────────────────────────
# OUTPUTS
# ─────────────────────────────────────────────────────────────────────────────
output "application_url" {
  description = "URL de la aplicación"
  value       = module.neumo.application_url
}

output "alb_dns_name" {
  description = "DNS del ALB (para configurar Route53)"
  value       = module.neumo.alb_dns_name
}

output "ecr_repositories" {
  description = "URLs de repositorios ECR"
  value       = module.neumo.ecr_repository_urls
}

output "patterns_summary" {
  description = "Resumen de patrones de disponibilidad"
  value       = module.neumo.availability_patterns_summary
}

