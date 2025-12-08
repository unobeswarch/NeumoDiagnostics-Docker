# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - TERRAFORM PROVIDERS
# ═══════════════════════════════════════════════════════════════════════════════
# Configuración de providers y backend para estado remoto
# ═══════════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend S3 para estado remoto (descomentar en producción)
  # backend "s3" {
  #   bucket         = "neumo-terraform-state"
  #   key            = "state/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "neumo-terraform-locks"
  # }
}

# ═══════════════════════════════════════════════════════════════════════════════
# AWS PROVIDER
# ═══════════════════════════════════════════════════════════════════════════════
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "NeumoDiagnostics"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "NeumoDiagnostics-Docker-1"
    }
  }
}

# Provider para ACM en us-east-1 (requerido para CloudFront si se usa)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "NeumoDiagnostics"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

