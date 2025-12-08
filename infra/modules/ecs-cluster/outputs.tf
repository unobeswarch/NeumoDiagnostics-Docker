# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO ECS CLUSTER - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "cluster_id" {
  description = "ID del cluster ECS"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ARN del cluster ECS"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "Nombre del cluster ECS"
  value       = aws_ecs_cluster.main.name
}

output "task_execution_role_arn" {
  description = "ARN del rol de ejecución de tareas"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "task_role_arn" {
  description = "ARN del rol de tareas (runtime)"
  value       = aws_iam_role.ecs_task.arn
}

output "log_group_name" {
  description = "Nombre del log group de CloudWatch"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "log_group_arn" {
  description = "ARN del log group de CloudWatch"
  value       = aws_cloudwatch_log_group.ecs.arn
}

