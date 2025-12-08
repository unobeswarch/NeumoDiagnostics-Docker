# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO ECS SERVICE - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "service_id" {
  description = "ID del servicio ECS"
  value       = aws_ecs_service.main.id
}

output "service_name" {
  description = "Nombre del servicio ECS"
  value       = aws_ecs_service.main.name
}

output "service_arn" {
  description = "ARN del servicio ECS"
  value       = aws_ecs_service.main.cluster
}

output "task_definition_arn" {
  description = "ARN de la task definition"
  value       = aws_ecs_task_definition.main.arn
}

output "task_definition_family" {
  description = "Familia de la task definition"
  value       = aws_ecs_task_definition.main.family
}

output "security_group_id" {
  description = "ID del security group del servicio"
  value       = aws_security_group.service.id
}

output "security_group_arn" {
  description = "ARN del security group del servicio"
  value       = aws_security_group.service.arn
}

