# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO ECR - OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════════

output "repository_urls" {
  description = "URLs de los repositorios"
  value       = { for k, v in aws_ecr_repository.main : k => v.repository_url }
}

output "repository_arns" {
  description = "ARNs de los repositorios"
  value       = { for k, v in aws_ecr_repository.main : k => v.arn }
}

output "registry_id" {
  description = "ID del registry (account ID)"
  value       = length(aws_ecr_repository.main) > 0 ? values(aws_ecr_repository.main)[0].registry_id : null
}

# Mapa de servicio -> imagen URI para usar en task definitions
output "image_uris" {
  description = "URIs de imágenes (repositorio:latest)"
  value       = { for k, v in aws_ecr_repository.main : k => "${v.repository_url}:latest" }
}

