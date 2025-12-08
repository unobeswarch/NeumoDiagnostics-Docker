# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO SERVICE DISCOVERY - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "namespace_id" {
  description = "ID del namespace de service discovery"
  value       = aws_service_discovery_private_dns_namespace.main.id
}

output "namespace_arn" {
  description = "ARN del namespace de service discovery"
  value       = aws_service_discovery_private_dns_namespace.main.arn
}

output "namespace_name" {
  description = "Nombre DNS del namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "namespace_hosted_zone" {
  description = "ID de la hosted zone de Route 53"
  value       = aws_service_discovery_private_dns_namespace.main.hosted_zone
}

output "service_arns" {
  description = "ARNs de los servicios registrados"
  value       = { for k, v in aws_service_discovery_service.services : k => v.arn }
}

output "service_ids" {
  description = "IDs de los servicios registrados"
  value       = { for k, v in aws_service_discovery_service.services : k => v.id }
}

# Endpoint de cada servicio para configurar variables de entorno
output "service_endpoints" {
  description = "Endpoints DNS de cada servicio"
  value = {
    for k, v in var.services : k => "${k}.${var.namespace_name}"
  }
}

