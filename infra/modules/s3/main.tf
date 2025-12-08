# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: S3 BUCKETS
# ═══════════════════════════════════════════════════════════════════════════════
# Buckets para modelos ML, radiografías, y logs
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET PARA MODELOS ML
# Almacena el modelo de TensorFlow/Keras
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "models" {
  bucket = "${var.name_prefix}-models-${var.account_id}"

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-models"
    Purpose = "ML Models Storage"
  })
}

resource "aws_s3_bucket_versioning" "models" {
  bucket = aws_s3_bucket.models.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "models" {
  bucket = aws_s3_bucket.models.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_arn != null ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "models" {
  bucket = aws_s3_bucket.models.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET PARA RADIOGRAFÍAS
# Almacena las imágenes de radiografías subidas
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "radiographs" {
  bucket = "${var.name_prefix}-radiographs-${var.account_id}"

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-radiographs"
    Purpose = "Radiograph Images Storage"
  })
}

resource "aws_s3_bucket_versioning" "radiographs" {
  bucket = aws_s3_bucket.radiographs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "radiographs" {
  bucket = aws_s3_bucket.radiographs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_arn != null ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "radiographs" {
  bucket = aws_s3_bucket.radiographs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle para mover a Glacier después de X días
resource "aws_s3_bucket_lifecycle_configuration" "radiographs" {
  bucket = aws_s3_bucket.radiographs.id

  rule {
    id     = "archive-old-radiographs"
    status = "Enabled"

    # Filter requerido en AWS Provider 5.x
    filter {
      prefix = ""  # Aplica a todos los objetos
    }

    transition {
      days          = var.radiograph_archive_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.radiograph_expiry_days
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET PARA LOGS (ALB, VPC Flow Logs, etc.)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "logs" {
  count = var.create_logs_bucket ? 1 : 0

  bucket = "${var.name_prefix}-logs-${var.account_id}"

  tags = merge(var.tags, {
    Name    = "${var.name_prefix}-logs"
    Purpose = "Application Logs"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  count = var.create_logs_bucket ? 1 : 0

  bucket = aws_s3_bucket.logs[0].id

  versioning_configuration {
    status = "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  count = var.create_logs_bucket ? 1 : 0

  bucket = aws_s3_bucket.logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  count = var.create_logs_bucket ? 1 : 0

  bucket = aws_s3_bucket.logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Policy para permitir que ALB escriba logs
resource "aws_s3_bucket_policy" "logs" {
  count = var.create_logs_bucket ? 1 : 0

  bucket = aws_s3_bucket.logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ALBAccessLogs"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.elb_account_id}:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs[0].arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  count = var.create_logs_bucket ? 1 : 0

  bucket = aws_s3_bucket.logs[0].id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    # Filter requerido en AWS Provider 5.x
    filter {
      prefix = ""  # Aplica a todos los objetos
    }

    expiration {
      days = var.log_expiry_days
    }
  }
}

