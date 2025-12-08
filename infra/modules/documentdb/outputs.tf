# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO DOCUMENTDB - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "cluster_id" {
  description = "ID del cluster DocumentDB"
  value       = aws_docdb_cluster.main.id
}

output "cluster_arn" {
  description = "ARN del cluster DocumentDB"
  value       = aws_docdb_cluster.main.arn
}

output "endpoint" {
  description = "Endpoint del cluster (read/write)"
  value       = aws_docdb_cluster.main.endpoint
}

output "reader_endpoint" {
  description = "Reader endpoint (read-only, balanceado)"
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "port" {
  description = "Puerto del cluster"
  value       = aws_docdb_cluster.main.port
}

output "master_username" {
  description = "Usuario maestro"
  value       = aws_docdb_cluster.main.master_username
  sensitive   = true
}

output "security_group_id" {
  description = "ID del security group"
  value       = aws_security_group.docdb.id
}

output "instance_endpoints" {
  description = "Endpoints de las instancias individuales"
  value       = aws_docdb_cluster_instance.main[*].endpoint
}

# Connection string para usar en variables de entorno
output "connection_string" {
  description = "Connection string para MongoDB driver"
  value       = "mongodb://${aws_docdb_cluster.main.master_username}:PASSWORD@${aws_docdb_cluster.main.endpoint}:${aws_docdb_cluster.main.port}/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred"
  sensitive   = true
}

