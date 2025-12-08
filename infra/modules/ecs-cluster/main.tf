# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: ECS CLUSTER
# ═══════════════════════════════════════════════════════════════════════════════
# Crea el cluster ECS con Fargate como capacity provider
# Implementa la base para el Cluster Pattern (Escenario 3)
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# ECS CLUSTER
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  # Escenario 3: Cluster Pattern - Container Insights para monitoreo
  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = merge(var.tags, {
    Name     = "${var.name_prefix}-cluster"
    Pattern  = "Cluster"
    Scenario = "3-ClusterPattern"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# CAPACITY PROVIDERS
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  # Estrategia por defecto: Fargate regular con base mínima
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = var.fargate_base_count
  }

  # Fargate Spot para ahorro de costos en cargas tolerantes a interrupciones
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = var.fargate_spot_weight
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# CLOUDWATCH LOG GROUP PARA ECS
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# ─────────────────────────────────────────────────────────────────────────────
# IAM ROLE PARA TASK EXECUTION
# Permite a ECS pull de ECR y enviar logs a CloudWatch
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.name_prefix}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Política adicional para acceso a Secrets Manager (para credenciales de BD)
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.name_prefix}-ecs-secrets-policy"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# IAM ROLE PARA TASK (RUNTIME)
# Permisos que los contenedores necesitan durante ejecución
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "ecs_task" {
  name = "${var.name_prefix}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Política para acceso a S3 (modelos ML, radiografías)
resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.name_prefix}-ecs-s3-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.name_prefix}-*",
          "arn:aws:s3:::${var.name_prefix}-*/*"
        ]
      }
    ]
  })
}

# Política para X-Ray (trazabilidad distribuida opcional)
resource "aws_iam_role_policy" "ecs_task_xray" {
  count = var.enable_xray ? 1 : 0

  name = "${var.name_prefix}-ecs-xray-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets"
        ]
        Resource = "*"
      }
    ]
  })
}

