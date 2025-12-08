# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO S3 - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "models_bucket_name" {
  description = "Nombre del bucket de modelos"
  value       = aws_s3_bucket.models.id
}

output "models_bucket_arn" {
  description = "ARN del bucket de modelos"
  value       = aws_s3_bucket.models.arn
}

output "radiographs_bucket_name" {
  description = "Nombre del bucket de radiografías"
  value       = aws_s3_bucket.radiographs.id
}

output "radiographs_bucket_arn" {
  description = "ARN del bucket de radiografías"
  value       = aws_s3_bucket.radiographs.arn
}

output "logs_bucket_name" {
  description = "Nombre del bucket de logs"
  value       = var.create_logs_bucket ? aws_s3_bucket.logs[0].id : null
}

output "logs_bucket_arn" {
  description = "ARN del bucket de logs"
  value       = var.create_logs_bucket ? aws_s3_bucket.logs[0].arn : null
}

# URI del modelo para variable de entorno
output "model_s3_uri" {
  description = "URI S3 del modelo ML"
  value       = "s3://${aws_s3_bucket.models.id}/models/finalModel.keras"
}

