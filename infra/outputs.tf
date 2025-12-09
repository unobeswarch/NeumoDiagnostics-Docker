# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# NETWORKING
# ─────────────────────────────────────────────────────────────────────────────
output "vpc_id" {
  description = "ID de la VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs de las subnets públicas"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs de las subnets privadas"
  value       = module.network.private_subnet_ids
}

# ─────────────────────────────────────────────────────────────────────────────
# ECS
# ─────────────────────────────────────────────────────────────────────────────
output "ecs_cluster_id" {
  description = "ID del cluster ECS"
  value       = module.ecs_cluster.cluster_id
}

output "ecs_cluster_name" {
  description = "Nombre del cluster ECS"
  value       = module.ecs_cluster.cluster_name
}

# ─────────────────────────────────────────────────────────────────────────────
# LOAD BALANCERS
# ─────────────────────────────────────────────────────────────────────────────
output "alb_public_dns_name" {
  description = "DNS name del ALB público (para web-frontend)"
  value       = module.alb_public.alb_dns_name
}

output "alb_internal_dns_name" {
  description = "DNS name del ALB interno (para api-gateway - Hot Spare)"
  value       = module.alb_internal.alb_dns_name
}

output "application_url" {
  description = "URL de la aplicación"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.alb_public.alb_dns_name}"
}

output "api_gateway_internal_url" {
  description = "URL interna del API Gateway (Hot Spare via ALB interno)"
  value       = "http://${module.alb_internal.alb_dns_name}"
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICE DISCOVERY
# ─────────────────────────────────────────────────────────────────────────────
output "service_discovery_namespace" {
  description = "Namespace de Service Discovery"
  value       = module.service_discovery.namespace_name
}

output "service_endpoints" {
  description = "Endpoints de los servicios internos"
  value       = module.service_discovery.service_endpoints
}

# ─────────────────────────────────────────────────────────────────────────────
# DATABASES
# ─────────────────────────────────────────────────────────────────────────────
output "rds_endpoint" {
  description = "Endpoint de RDS PostgreSQL"
  value       = module.rds.endpoint
}

output "rds_multi_az_enabled" {
  description = "Estado de Multi-AZ de RDS (Escenario 4: Warm Spare)"
  value       = module.rds.multi_az
}

output "mongodb_endpoint" {
  description = "Endpoint de MongoDB (via Cloud Map)"
  value       = "mongodb.${local.service_discovery_namespace}:27017"
}

# ─────────────────────────────────────────────────────────────────────────────
# MESSAGE BROKER
# ─────────────────────────────────────────────────────────────────────────────
output "rabbitmq_endpoint" {
  description = "Endpoint de RabbitMQ (via Cloud Map)"
  value       = "rabbitmq.${local.service_discovery_namespace}:5672"
}

# ─────────────────────────────────────────────────────────────────────────────
# ECR
# ─────────────────────────────────────────────────────────────────────────────
output "ecr_repository_urls" {
  description = "URLs de los repositorios ECR"
  value       = module.ecr.repository_urls
}

# ─────────────────────────────────────────────────────────────────────────────
# S3
# ─────────────────────────────────────────────────────────────────────────────
output "s3_models_bucket" {
  description = "Bucket S3 para modelos ML"
  value       = module.s3.models_bucket_name
}

output "s3_radiographs_bucket" {
  description = "Bucket S3 para radiografías"
  value       = module.s3.radiographs_bucket_name
}

# ─────────────────────────────────────────────────────────────────────────────
# PATTERN SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
output "availability_patterns_summary" {
  description = "Resumen de patrones de disponibilidad implementados"
  value = {
    scenario_1_hot_spare = {
      description   = "API Gateway con 3+ tareas activas detrás de ALB interno"
      component     = "api-gateway"
      tasks         = var.api_gateway_desired_count
      load_balancer = "ALB Interno: ${module.alb_internal.alb_dns_name}"
      architecture  = <<-EOT
        web-frontend → ALB Interno → [api-gateway-1, api-gateway-2, api-gateway-3]
        Si una instancia falla, ALB detecta via health check y redistribuye tráfico
      EOT
    }
    scenario_2_service_discovery = {
      description = "Service Discovery vía AWS Cloud Map"
      namespace   = module.service_discovery.namespace_name
      services    = keys(module.service_discovery.service_endpoints)
    }
    scenario_3_cluster = {
      description = "Cluster Pattern con N+1 redundancia"
      component   = "prediagnostic-be"
      tasks       = var.prediagnostic_be_desired_count
      min_tasks   = var.prediagnostic_min_capacity
      max_tasks   = var.prediagnostic_max_capacity
    }
    scenario_4_warm_spare = {
      description = "Database Failover con RDS Multi-AZ"
      component   = "auth-db (RDS PostgreSQL)"
      multi_az    = var.rds_multi_az
      endpoint    = module.rds.endpoint
    }
  }
}

