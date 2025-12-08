# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO AMAZON MQ - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "broker_id" {
  description = "ID del broker"
  value       = aws_mq_broker.main.id
}

output "broker_arn" {
  description = "ARN del broker"
  value       = aws_mq_broker.main.arn
}

# Endpoints AMQP
output "amqp_endpoints" {
  description = "Endpoints AMQP"
  value       = aws_mq_broker.main.instances[*].endpoints
}

# Console URL
output "console_url" {
  description = "URL de la consola de administración"
  value       = aws_mq_broker.main.instances[*].console_url
}

output "security_group_id" {
  description = "ID del security group"
  value       = aws_security_group.mq.id
}

# Connection string para usar en variables de entorno
# Formato: amqps://user:password@host:5671/
output "primary_endpoint" {
  description = "Endpoint primario para conexión"
  value       = length(aws_mq_broker.main.instances) > 0 ? aws_mq_broker.main.instances[0].endpoints[0] : null
}

