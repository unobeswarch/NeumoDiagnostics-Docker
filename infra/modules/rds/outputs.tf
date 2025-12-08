# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO RDS - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "instance_id" {
  description = "ID de la instancia RDS"
  value       = aws_db_instance.main.id
}

output "instance_arn" {
  description = "ARN de la instancia RDS"
  value       = aws_db_instance.main.arn
}

output "endpoint" {
  description = "Endpoint de conexión (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "Hostname de la instancia"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "Puerto de la instancia"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Nombre de la base de datos"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "Usuario maestro"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "security_group_id" {
  description = "ID del security group"
  value       = aws_security_group.rds.id
}

# Connection string para usar en variables de entorno
output "connection_string" {
  description = "Connection string para PostgreSQL"
  value       = "postgres://${aws_db_instance.main.username}:PASSWORD@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "multi_az" {
  description = "Si Multi-AZ está habilitado"
  value       = aws_db_instance.main.multi_az
}

output "availability_zone" {
  description = "Zona de disponibilidad de la instancia primaria"
  value       = aws_db_instance.main.availability_zone
}

