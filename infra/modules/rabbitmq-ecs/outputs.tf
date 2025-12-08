output "endpoint" {
  description = "Endpoint de RabbitMQ (Cloud Map DNS)"
  value       = "rabbitmq.${var.name_prefix}.internal"
}

output "amqp_url" {
  description = "URL AMQP para conexión"
  value       = "amqp://${var.rabbitmq_user}:${var.rabbitmq_password}@rabbitmq.${var.name_prefix}.internal:5672/"
  sensitive   = true
}

output "security_group_id" {
  description = "ID del Security Group de RabbitMQ"
  value       = aws_security_group.rabbitmq.id
}

output "management_url" {
  description = "URL del Management UI de RabbitMQ"
  value       = "http://rabbitmq.${var.name_prefix}.internal:15672"
}
