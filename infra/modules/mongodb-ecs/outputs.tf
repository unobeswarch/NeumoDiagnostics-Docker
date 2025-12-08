# ═══════════════════════════════════════════════════════════════════════════════
# MONGODB ECS - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "connection_string" {
  description = "MongoDB connection string (usa Cloud Map DNS)"
  value       = "mongodb://mongodb.${var.name_prefix}.internal:27017/${var.database_name}"
}

output "security_group_id" {
  description = "ID del security group de MongoDB"
  value       = aws_security_group.mongodb.id
}

output "service_name" {
  description = "Nombre del servicio ECS"
  value       = aws_ecs_service.mongodb.name
}

