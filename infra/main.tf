# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - INFRAESTRUCTURA PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════
# Este archivo orquesta todos los módulos para crear la infraestructura completa
# 
# PATRONES DE DISPONIBILIDAD IMPLEMENTADOS:
#   - Escenario 1: Hot Spare (API Gateway con ALB)
#   - Escenario 2: Service Discovery (AWS Cloud Map)
#   - Escenario 3: Cluster Pattern (ECS Multi-AZ con Autoscaling)
#   - Escenario 4: Database Failover (RDS Multi-AZ)
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCES
# ─────────────────────────────────────────────────────────────────────────────
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: NETWORKING (VPC, Subnets, NAT Gateway)
# ─────────────────────────────────────────────────────────────────────────────
module "network" {
  source = "./modules/network"

  name_prefix          = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = var.enable_nat_gateway
  single_nat_gateway   = var.single_nat_gateway
  enable_vpc_endpoints = var.environment == "prod"
  enable_flow_logs     = var.environment == "prod"
  aws_region           = var.aws_region
  tags                 = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: ECR (Container Registry)
# ─────────────────────────────────────────────────────────────────────────────
module "ecr" {
  source = "./modules/ecr"

  name_prefix      = var.project_name
  repository_names = local.ecr_repositories
  scan_on_push     = true
  tags             = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: S3 (Models, Radiographs, Logs)
# ─────────────────────────────────────────────────────────────────────────────
module "s3" {
  source = "./modules/s3"

  name_prefix        = local.name_prefix
  account_id         = data.aws_caller_identity.current.account_id
  create_logs_bucket = var.environment == "prod"
  tags               = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: ECS CLUSTER
# Escenario 3: Cluster Pattern - Base para servicios distribuidos
# ─────────────────────────────────────────────────────────────────────────────
module "ecs_cluster" {
  source = "./modules/ecs-cluster"

  name_prefix               = local.name_prefix
  enable_container_insights = var.enable_container_insights
  fargate_base_count        = 2
  fargate_spot_weight       = var.environment == "prod" ? 0 : 1
  log_retention_days        = var.environment == "prod" ? 90 : 14

  tags = merge(local.common_tags, local.pattern_tags.scenario_3)
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: SERVICE DISCOVERY (AWS Cloud Map)
# Escenario 2: Service Discovery Pattern
# ─────────────────────────────────────────────────────────────────────────────
module "service_discovery" {
  source = "./modules/service-discovery"

  name_prefix    = local.name_prefix
  namespace_name = local.service_discovery_namespace
  vpc_id         = module.network.vpc_id

  services = {
    # API Gateway también necesita Cloud Map para que web-frontend
    # pueda llamarlo internamente (Server Actions)
    "api-gateway" = {
      port = local.services.api_gateway.port
    }
    "auth-be" = {
      port = local.services.auth_be.port
    }
    "prediagnostic-be" = {
      port = local.services.prediagnostic_be.port
    }
    "message-producer" = {
      port = local.services.message_producer.port
    }
    "notification-be" = {
      port = local.services.notification_be.port
    }
    # MongoDB para prediagnostic-be
    "mongodb" = {
      port = 27017
    }
    # RabbitMQ en ECS (reemplaza Amazon MQ para Free Tier)
    "rabbitmq" = {
      port = 5672
    }
  }

  tags = merge(local.common_tags, local.pattern_tags.scenario_2)
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: APPLICATION LOAD BALANCER (Público)
# Solo para web-frontend - punto de entrada desde Internet
# ─────────────────────────────────────────────────────────────────────────────
module "alb_public" {
  source = "./modules/alb"

  name_prefix     = local.name_prefix
  alb_name        = "public"
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.public_subnet_ids
  internal        = false
  redirect_to_https = var.domain_name != ""
  certificate_arn   = var.domain_name != "" ? aws_acm_certificate.main[0].arn : null

  # Solo web-frontend es público
  # API Gateway se accede SOLO via ALB interno (Hot Spare)
  target_groups = {
    "web-frontend" = {
      port                 = local.services.web_frontend.port
      health_check_path    = local.services.web_frontend.health_path
      health_check_matcher = "200"
      priority             = local.services.web_frontend.priority
      path_patterns        = ["/*"]
    }
  }

  tags = merge(local.common_tags, {
    Purpose = "PublicAccess"
    Service = "web-frontend"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: APPLICATION LOAD BALANCER (Interno)
# Escenario 1: HOT SPARE - Balanceo entre múltiples instancias de API Gateway
# Reemplaza el reverse-proxy Nginx de Docker
# ─────────────────────────────────────────────────────────────────────────────
module "alb_internal" {
  source = "./modules/alb"

  name_prefix     = local.name_prefix
  alb_name        = "internal"
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.private_subnet_ids  # Subnets PRIVADAS
  internal        = true  # ALB INTERNO - no expuesto a Internet
  redirect_to_https = false  # Sin HTTPS interno (tráfico ya en VPC)
  certificate_arn   = null

  # Allow traffic from entire VPC (all services can reach internal ALB)
  allowed_cidr_blocks = [var.vpc_cidr]

  # API Gateway con Hot Spare pattern
  # 3 instancias distribuidas reciben tráfico simultáneamente
  target_groups = {
    "api-gateway" = {
      port                 = local.services.api_gateway.port
      health_check_path    = local.services.api_gateway.health_path
      health_check_matcher = "200"
      priority             = 10
      path_patterns        = ["/*"]  # Todo el tráfico va a api-gateway
    }
  }

  tags = merge(local.common_tags, local.pattern_tags.scenario_1, {
    Purpose = "InternalLoadBalancer"
    Pattern = "HotSpare"
    Service = "api-gateway"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: RDS PostgreSQL
# Escenario 4: Warm Spare - Database Failover con Multi-AZ
# ─────────────────────────────────────────────────────────────────────────────
module "rds" {
  source = "./modules/rds"

  name_prefix   = local.name_prefix
  db_identifier = "auth-db"
  vpc_id        = module.network.vpc_id
  subnet_ids    = module.network.private_subnet_ids

  # Security: Usar CIDR en lugar de SG para evitar dependencia circular
  # Los servicios ECS referencian RDS, así que RDS no puede referenciar los SG de ECS
  allowed_cidr_blocks = module.network.private_subnet_cidrs

  # Database
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password

  # Instance
  instance_class        = var.rds_instance_class
  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage

  # Escenario 4: WARM SPARE - Multi-AZ habilitado
  multi_az = var.rds_multi_az

  # Protection (más estricto en prod)
  deletion_protection = var.environment == "prod"
  skip_final_snapshot = var.environment != "prod"

  tags = merge(local.common_tags, local.pattern_tags.scenario_4)
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: MongoDB en ECS (Alternativa a DocumentDB para Free Tier)
# ─────────────────────────────────────────────────────────────────────────────
# DocumentDB no está disponible en Free Tier, así que usamos MongoDB en ECS
# Costo: ~$5/mes vs ~$57/mes de DocumentDB
module "mongodb" {
  source = "./modules/mongodb-ecs"

  name_prefix         = local.name_prefix
  vpc_id              = module.network.vpc_id
  subnet_ids          = module.network.private_subnet_ids
  allowed_cidr_blocks = module.network.private_subnet_cidrs

  cluster_id         = module.ecs_cluster.cluster_id
  execution_role_arn = module.ecs_cluster.task_execution_role_arn
  task_role_arn      = module.ecs_cluster.task_role_arn
  log_group_name     = module.ecs_cluster.log_group_name
  aws_region         = var.aws_region

  database_name = "prediagnostic_db"
  cpu           = "256"
  memory        = "512"

  # Service Discovery para que prediagnostic-be lo encuentre
  service_discovery_arn = module.service_discovery.service_arns["mongodb"]

  tags = merge(local.common_tags, {
    Service = "mongodb"
    Purpose = "Prediagnostic Database"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# MÓDULO: RabbitMQ en ECS (Alternativa a Amazon MQ para Free Tier)
# ─────────────────────────────────────────────────────────────────────────────
# Similar a docker-compose local: usa la imagen oficial de RabbitMQ
# Costo: ~$5/mes vs ~$40/mes de Amazon MQ
module "rabbitmq" {
  source = "./modules/rabbitmq-ecs"

  name_prefix         = local.name_prefix
  vpc_id              = module.network.vpc_id
  subnet_ids          = module.network.private_subnet_ids
  allowed_cidr_blocks = module.network.private_subnet_cidrs

  cluster_id         = module.ecs_cluster.cluster_id
  execution_role_arn = module.ecs_cluster.task_execution_role_arn
  task_role_arn      = module.ecs_cluster.task_role_arn
  log_group_name     = module.ecs_cluster.log_group_name
  aws_region         = var.aws_region

  # Credentials (same as docker-compose for simplicity)
  rabbitmq_user     = "guest"
  rabbitmq_password = "guest"

  cpu    = 256
  memory = 512
  
  # TEMPORARILY DISABLED - Docker Hub rate limits causing failures
  desired_count = 0

  # Service Discovery para que los servicios lo encuentren
  service_discovery_arn = module.service_discovery.service_arns["rabbitmq"]

  tags = merge(local.common_tags, {
    Service = "rabbitmq"
    Purpose = "Message Broker"
  })
}

# ═══════════════════════════════════════════════════════════════════════════════
# ECS SERVICES
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# API GATEWAY SERVICE
# Escenario 1: HOT SPARE - 3 tareas activas con ALB INTERNO
# ─────────────────────────────────────────────────────────────────────────────
module "ecs_service_api_gateway" {
  source = "./modules/ecs-service"

  name_prefix   = local.name_prefix
  service_name  = local.services.api_gateway.name
  aws_region    = var.aws_region
  cluster_id    = module.ecs_cluster.cluster_id
  cluster_name  = module.ecs_cluster.cluster_name
  vpc_id        = module.network.vpc_id
  subnet_ids    = module.network.private_subnet_ids

  # Container
  container_image = module.ecr.image_uris["api-gateway"]
  container_port  = local.services.api_gateway.port
  cpu             = local.services.api_gateway.cpu
  memory          = local.services.api_gateway.memory

  # Escenario 1: HOT SPARE - 3 tareas activas procesando en paralelo
  desired_count = local.services.api_gateway.desired_count

  # IAM
  execution_role_arn = module.ecs_cluster.task_execution_role_arn
  task_role_arn      = module.ecs_cluster.task_role_arn

  # Logs
  log_group_name = module.ecs_cluster.log_group_name

  # ═══════════════════════════════════════════════════════════════════════════
  # HOT SPARE: ALB INTERNO distribuye tráfico entre 3 instancias activas
  # Si una falla, las otras 2 siguen procesando sin interrupción
  # ═══════════════════════════════════════════════════════════════════════════
  target_group_arn   = module.alb_internal.target_group_arns["api-gateway"]
  alb_listener_arn   = module.alb_internal.http_listener_arn
  alb_resource_label = module.alb_internal.alb_resource_labels["api-gateway"]
  
  # Permitir tráfico desde ALB interno
  allowed_security_groups = [module.alb_internal.security_group_id]
  # También desde subnets privadas (otros servicios vía Cloud Map como fallback)
  allowed_cidr_blocks     = module.network.private_subnet_cidrs

  # Service Discovery (registro en Cloud Map para otros servicios internos)
  service_discovery_arn = module.service_discovery.service_arns["api-gateway"]

  # Variables de entorno - API Gateway conecta a otros servicios via Cloud Map
  environment_variables = [
    {
      name  = "AUTH_SERVICE_URL"
      value = "http://auth-be.${local.service_discovery_namespace}:${local.services.auth_be.port}"
    },
    {
      name  = "PREDIAGNOSTIC_SERVICE_URL"
      value = "http://prediagnostic-be.${local.service_discovery_namespace}:${local.services.prediagnostic_be.port}"
    },
    {
      name  = "NOTIFICATION_SERVICE_URL"
      value = "http://message-producer.${local.service_discovery_namespace}:${local.services.message_producer.port}"
    }
  ]

  # Auto Scaling para Hot Spare
  enable_autoscaling = true
  min_capacity       = local.services.api_gateway.min_capacity
  max_capacity       = local.services.api_gateway.max_capacity
  cpu_target_value   = 70

  tags = merge(local.common_tags, local.pattern_tags.scenario_1, {
    Service = "api-gateway"
    Pattern = "HotSpare"
    LoadBalancer = "Internal"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# AUTH BACKEND SERVICE
# Escenario 2: SERVICE DISCOVERY - Registro automático en Cloud Map
# ─────────────────────────────────────────────────────────────────────────────
module "ecs_service_auth_be" {
  source = "./modules/ecs-service"

  name_prefix   = local.name_prefix
  service_name  = local.services.auth_be.name
  aws_region    = var.aws_region
  cluster_id    = module.ecs_cluster.cluster_id
  cluster_name  = module.ecs_cluster.cluster_name
  vpc_id        = module.network.vpc_id
  subnet_ids    = module.network.private_subnet_ids

  # Container
  container_image = module.ecr.image_uris["auth-be"]
  container_port  = local.services.auth_be.port
  cpu             = local.services.auth_be.cpu
  memory          = local.services.auth_be.memory

  desired_count = local.services.auth_be.desired_count

  # IAM
  execution_role_arn = module.ecs_cluster.task_execution_role_arn
  task_role_arn      = module.ecs_cluster.task_role_arn

  # Logs
  log_group_name = module.ecs_cluster.log_group_name

  # Escenario 2: Service Discovery
  service_discovery_arn = module.service_discovery.service_arns["auth-be"]
  allowed_cidr_blocks   = [var.vpc_cidr]

  # Variables de entorno
  environment_variables = [
    {
      # DATABASE_URL uses key-value format compatible with Go's lib/pq driver
      # RDS endpoint includes port (e.g., host.rds.amazonaws.com:5432)
      name  = "DATABASE_URL"
      value = "host=${module.rds.address} port=${module.rds.port} user=${var.db_username} password=${var.db_password} dbname=${var.db_name} sslmode=require"
    }
  ]

  # Auto Scaling
  enable_autoscaling = true
  min_capacity       = local.services.auth_be.min_capacity
  max_capacity       = local.services.auth_be.max_capacity

  tags = merge(local.common_tags, local.pattern_tags.scenario_2, {
    Service = "auth-be"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# PREDIAGNOSTIC BACKEND SERVICE
# Escenario 3: CLUSTER PATTERN - N+1 redundancia con autoscaling
# ─────────────────────────────────────────────────────────────────────────────
module "ecs_service_prediagnostic" {
  source = "./modules/ecs-service"

  name_prefix   = local.name_prefix
  service_name  = local.services.prediagnostic_be.name
  aws_region    = var.aws_region
  cluster_id    = module.ecs_cluster.cluster_id
  cluster_name  = module.ecs_cluster.cluster_name
  vpc_id        = module.network.vpc_id
  subnet_ids    = module.network.private_subnet_ids

  # Container (más recursos para ML)
  container_image = module.ecr.image_uris["prediagnostic-be"]
  container_port  = local.services.prediagnostic_be.port
  cpu             = local.services.prediagnostic_be.cpu
  memory          = local.services.prediagnostic_be.memory

  # Escenario 3: CLUSTER PATTERN - Múltiples tareas distribuidas
  desired_count = local.services.prediagnostic_be.desired_count

  # IAM
  execution_role_arn = module.ecs_cluster.task_execution_role_arn
  task_role_arn      = module.ecs_cluster.task_role_arn

  # Logs
  log_group_name = module.ecs_cluster.log_group_name

  # Service Discovery
  service_discovery_arn = module.service_discovery.service_arns["prediagnostic-be"]
  allowed_cidr_blocks   = [var.vpc_cidr]

  # Variables de entorno
  environment_variables = [
    {
      # MongoDB en ECS via Cloud Map (sin autenticación para simplicidad en dev)
      name  = "MONGODB_URL"
      value = "mongodb://mongodb.${local.service_discovery_namespace}:27017/prediagnostic_db"
    },
    {
      name  = "MODEL_PATH"
      value = module.s3.model_s3_uri
    },
    {
      name  = "API_PORT"
      value = tostring(local.services.prediagnostic_be.port)
    }
  ]

  # Escenario 3: Auto Scaling para Cluster Pattern
  enable_autoscaling   = true
  min_capacity         = local.services.prediagnostic_be.min_capacity
  max_capacity         = local.services.prediagnostic_be.max_capacity
  cpu_target_value     = 70
  enable_memory_scaling = true
  memory_target_value  = 70

  tags = merge(local.common_tags, local.pattern_tags.scenario_3, {
    Service = "prediagnostic-be"
    Pattern = "ClusterN+1"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# MESSAGE PRODUCER SERVICE
# ─────────────────────────────────────────────────────────────────────────────
module "ecs_service_message_producer" {
  source = "./modules/ecs-service"

  name_prefix   = local.name_prefix
  service_name  = local.services.message_producer.name
  aws_region    = var.aws_region
  cluster_id    = module.ecs_cluster.cluster_id
  cluster_name  = module.ecs_cluster.cluster_name
  vpc_id        = module.network.vpc_id
  subnet_ids    = module.network.private_subnet_ids

  # Container
  container_image = module.ecr.image_uris["message-producer"]
  container_port  = local.services.message_producer.port
  cpu             = local.services.message_producer.cpu
  memory          = local.services.message_producer.memory

  desired_count = local.services.message_producer.desired_count

  # IAM
  execution_role_arn = module.ecs_cluster.task_execution_role_arn
  task_role_arn      = module.ecs_cluster.task_role_arn

  # Logs
  log_group_name = module.ecs_cluster.log_group_name

  # Service Discovery
  service_discovery_arn = module.service_discovery.service_arns["message-producer"]
  allowed_cidr_blocks   = [var.vpc_cidr]

  # Variables de entorno
  environment_variables = [
    {
      # RabbitMQ en ECS via Cloud Map (como en docker-compose)
      name  = "RABBITMQ_URL"
      value = "amqp://guest:guest@rabbitmq.${local.service_discovery_namespace}:5672/"
    }
  ]

  # Auto Scaling
  enable_autoscaling = true
  min_capacity       = local.services.message_producer.min_capacity
  max_capacity       = local.services.message_producer.max_capacity

  tags = merge(local.common_tags, {
    Service = "message-producer"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATION BACKEND SERVICE (Worker)
# ─────────────────────────────────────────────────────────────────────────────
module "ecs_service_notification" {
  source = "./modules/ecs-service"

  name_prefix   = local.name_prefix
  service_name  = local.services.notification_be.name
  aws_region    = var.aws_region
  cluster_id    = module.ecs_cluster.cluster_id
  cluster_name  = module.ecs_cluster.cluster_name
  vpc_id        = module.network.vpc_id
  subnet_ids    = module.network.private_subnet_ids

  # Container (Worker, no expone puerto HTTP)
  container_image = module.ecr.image_uris["notification-be"]
  container_port  = null  # Es un worker
  cpu             = local.services.notification_be.cpu
  memory          = local.services.notification_be.memory

  desired_count = local.services.notification_be.desired_count

  # IAM
  execution_role_arn = module.ecs_cluster.task_execution_role_arn
  task_role_arn      = module.ecs_cluster.task_role_arn

  # Logs
  log_group_name = module.ecs_cluster.log_group_name

  # Service Discovery
  service_discovery_arn = module.service_discovery.service_arns["notification-be"]
  allowed_cidr_blocks   = [var.vpc_cidr]

  # Variables de entorno
  environment_variables = [
    {
      # RabbitMQ en ECS via Cloud Map (como en docker-compose)
      name  = "RABBITMQ_URL"
      value = "amqp://guest:guest@rabbitmq.${local.service_discovery_namespace}:5672/"
    },
    {
      name  = "SMTP_HOST"
      value = var.smtp_host
    },
    {
      name  = "SMTP_PORT"
      value = tostring(var.smtp_port)
    },
    {
      name  = "SMTP_USERNAME"
      value = var.smtp_username
    },
    {
      name  = "SMTP_PASSWORD"
      value = var.smtp_password
    },
    {
      name  = "EMAIL_FROM"
      value = var.email_from
    }
  ]

  # Auto Scaling
  enable_autoscaling = true
  min_capacity       = local.services.notification_be.min_capacity
  max_capacity       = local.services.notification_be.max_capacity

  tags = merge(local.common_tags, {
    Service = "notification-be"
    Type    = "Worker"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# WEB FRONTEND SERVICE
# ─────────────────────────────────────────────────────────────────────────────
module "ecs_service_web_frontend" {
  source = "./modules/ecs-service"

  name_prefix   = local.name_prefix
  service_name  = local.services.web_frontend.name
  aws_region    = var.aws_region
  cluster_id    = module.ecs_cluster.cluster_id
  cluster_name  = module.ecs_cluster.cluster_name
  vpc_id        = module.network.vpc_id
  subnet_ids    = module.network.private_subnet_ids

  # Container
  container_image = module.ecr.image_uris["web-frontend"]
  container_port  = local.services.web_frontend.port
  cpu             = local.services.web_frontend.cpu
  memory          = local.services.web_frontend.memory

  desired_count = local.services.web_frontend.desired_count

  # IAM
  execution_role_arn = module.ecs_cluster.task_execution_role_arn
  task_role_arn      = module.ecs_cluster.task_role_arn

  # Logs
  log_group_name = module.ecs_cluster.log_group_name

  # Load Balancer
  target_group_arn = module.alb_public.target_group_arns["web-frontend"]
  alb_listener_arn = module.alb_public.http_listener_arn
  alb_resource_label = module.alb_public.alb_resource_labels["web-frontend"]
  allowed_security_groups = [module.alb_public.security_group_id]

  # Variables de entorno
  environment_variables = [
    {
      # Para Client Components (JavaScript en el navegador)
      # Los requests del browser van al ALB público, que sirve web-frontend
      # Luego Next.js hace Server Actions que llaman al ALB interno
      name  = "NEXT_PUBLIC_API_URL"
      value = "http://${module.alb_public.alb_dns_name}"
    },
    {
      # Server-side API calls go through Internal ALB (Hot Spare pattern)
      # This is the AWS equivalent of reverse-proxy in docker-compose
      name  = "SERVER_API_URL"
      value = "http://${module.alb_internal.alb_dns_name}"
    },
    {
      # GraphQL endpoint for Server Components via Internal ALB
      name  = "GRAPHQL_ENDPOINT"
      value = "http://${module.alb_internal.alb_dns_name}/graphql"
    },
    {
      name  = "NODE_ENV"
      value = var.environment == "prod" ? "production" : "development"
    }
  ]

  # Auto Scaling
  enable_autoscaling = true
  min_capacity       = local.services.web_frontend.min_capacity
  max_capacity       = local.services.web_frontend.max_capacity

  tags = merge(local.common_tags, {
    Service = "web-frontend"
  })
}

# ═══════════════════════════════════════════════════════════════════════════════
# OPCIONAL: ACM CERTIFICATE (si se usa dominio)
# ═══════════════════════════════════════════════════════════════════════════════
resource "aws_acm_certificate" "main" {
  count = var.domain_name != "" ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

