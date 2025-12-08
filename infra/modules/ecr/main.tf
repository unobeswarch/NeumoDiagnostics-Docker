# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: AMAZON ECR (Elastic Container Registry)
# ═══════════════════════════════════════════════════════════════════════════════
# Almacena las imágenes Docker de los microservicios
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# ECR REPOSITORIES
# Un repositorio por cada microservicio
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecr_repository" "main" {
  for_each = toset(var.repository_names)

  name                 = "${var.name_prefix}/${each.key}"
  image_tag_mutability = var.image_tag_mutability

  # Escaneo de vulnerabilidades al push
  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  # Encriptación
  encryption_configuration {
    encryption_type = var.kms_key_arn != null ? "KMS" : "AES256"
    kms_key         = var.kms_key_arn
  }

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}/${each.key}"
    Service = each.key
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# LIFECYCLE POLICY
# Limpia imágenes antiguas para ahorrar costos
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecr_lifecycle_policy" "main" {
  for_each = toset(var.repository_names)

  repository = aws_ecr_repository.main[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.keep_image_count} images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = var.keep_image_count
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images older than ${var.untagged_expiry_days} days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.untagged_expiry_days
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# REPOSITORY POLICY (Opcional - para cross-account access)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecr_repository_policy" "main" {
  for_each = var.cross_account_arns != null ? toset(var.repository_names) : []

  repository = aws_ecr_repository.main[each.key].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CrossAccountPull"
        Effect = "Allow"
        Principal = {
          AWS = var.cross_account_arns
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

