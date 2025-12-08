# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - LOCAL VALUES
# ═══════════════════════════════════════════════════════════════════════════════
# Valores computados localmente para uso en múltiples módulos
# ═══════════════════════════════════════════════════════════════════════════════

locals {
  # ─────────────────────────────────────────────────────────────────────────────
  # NAMING
  # ─────────────────────────────────────────────────────────────────────────────
  name_prefix = "${var.project_name}-${var.environment}"
  
  # Nombre del namespace de Service Discovery
  service_discovery_namespace = "${var.project_name}.internal"

  # ─────────────────────────────────────────────────────────────────────────────
  # SERVICE DEFINITIONS
  # ─────────────────────────────────────────────────────────────────────────────
  # Definición centralizada de todos los servicios para facilitar la gestión
  services = {
    api_gateway = {
      name          = "api-gateway"
      port          = 8080
      cpu           = var.api_gateway_cpu
      memory        = var.api_gateway_memory
      desired_count = var.api_gateway_desired_count
      min_capacity  = var.api_gateway_min_capacity
      max_capacity  = var.api_gateway_max_capacity
      # NOTA: API Gateway no tiene /health endpoint en el código actual
      # Usa "/" que devuelve GraphQL Playground (200 OK)
      # TODO: Agregar endpoint /health al código Go
      health_path   = "/"
      # En ALB, número MENOR = mayor prioridad
      # api-gateway debe evaluarse ANTES que web-frontend (que tiene /*)
      priority      = 10  # Para reglas de ALB - debe ser menor que web-frontend
      is_public     = true
      patterns = {
        replication = "hot_spare"   # Escenario 1
        scenario    = "1-HotSpare"
      }
    }
    
    auth_be = {
      name          = "auth-be"
      port          = 8081
      cpu           = var.auth_be_cpu
      memory        = var.auth_be_memory
      desired_count = var.auth_be_desired_count
      min_capacity  = 1
      max_capacity  = 4
      # NOTA: Auth-BE no tiene /health endpoint
      # Usa "/validation" que existe (devuelve 401 sin token, pero el servicio está vivo)
      # TODO: Agregar endpoint /health al código Go
      health_path   = "/validation"
      priority      = 200
      is_public     = false
      patterns = {
        discovery = "cloud_map"     # Escenario 2
        scenario  = "2-ServiceDiscovery"
      }
    }
    
    prediagnostic_be = {
      name          = "prediagnostic-be"
      port          = 8000
      cpu           = var.prediagnostic_be_cpu
      memory        = var.prediagnostic_be_memory
      desired_count = var.prediagnostic_be_desired_count
      min_capacity  = var.prediagnostic_min_capacity
      max_capacity  = var.prediagnostic_max_capacity
      # El health check está en /prediagnostic/health (ver routes.py)
      health_path   = "/prediagnostic/health"
      priority      = 300
      is_public     = false
      patterns = {
        cluster   = "n_plus_1"      # Escenario 3
        scenario  = "3-ClusterPattern"
      }
    }
    
    notification_be = {
      name          = "notification-be"
      port          = 8003  # Worker, no expone HTTP
      cpu           = var.notification_be_cpu
      memory        = var.notification_be_memory
      desired_count = var.notification_be_desired_count
      min_capacity  = 1
      max_capacity  = 4
      health_path   = null  # Es un worker, usa health check custom
      priority      = null
      is_public     = false
      patterns = {
        type     = "worker"
        scenario = "async-processing"
      }
    }
    
    message_producer = {
      name          = "message-producer"
      port          = 8082
      cpu           = var.message_producer_cpu
      memory        = var.message_producer_memory
      desired_count = var.message_producer_desired_count
      min_capacity  = 1
      max_capacity  = 4
      health_path   = "/health"
      priority      = 400
      is_public     = false
      patterns = {
        discovery = "cloud_map"
        scenario  = "2-ServiceDiscovery"
      }
    }
    
    web_frontend = {
      name          = "web-frontend"
      port          = 3000
      cpu           = var.web_frontend_cpu
      memory        = var.web_frontend_memory
      desired_count = var.web_frontend_desired_count
      min_capacity  = 1
      max_capacity  = 4
      health_path   = "/"
      # En ALB, número MENOR = mayor prioridad
      # web-frontend usa /* como fallback, debe evaluarse DESPUÉS que api-gateway
      priority      = 100  # Debe ser mayor que api-gateway (10)
      is_public     = true
      patterns = {
        type     = "frontend"
        scenario = "public-access"
      }
    }
  }

  # ─────────────────────────────────────────────────────────────────────────────
  # ECR REPOSITORIES
  # ─────────────────────────────────────────────────────────────────────────────
  # NOTA: cli-front-end NO está incluido porque es una aplicación de línea
  # de comandos que se ejecuta localmente en la PC del usuario, no en AWS.
  # El CLI se conecta al ALB público para acceder a las APIs.
  ecr_repositories = [
    "api-gateway",
    "auth-be",
    "prediagnostic-be",
    "notification-be",
    "message-producer",
    "web-frontend"
  ]

  # ─────────────────────────────────────────────────────────────────────────────
  # COMMON TAGS
  # ─────────────────────────────────────────────────────────────────────────────
  common_tags = merge(
    {
      Project     = "NeumoDiagnostics"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.additional_tags
  )

  # ─────────────────────────────────────────────────────────────────────────────
  # PATTERN TAGS (para identificar escenarios en recursos)
  # ─────────────────────────────────────────────────────────────────────────────
  pattern_tags = {
    scenario_1 = {
      Pattern        = "Replication"
      ReplicationType = "HotSpare"
      Scenario       = "1-Availability"
    }
    scenario_2 = {
      Pattern  = "ServiceDiscovery"
      Method   = "CloudMap"
      Scenario = "2-Discovery"
    }
    scenario_3 = {
      Pattern     = "Cluster"
      ClusterType = "N+1"
      Scenario    = "3-Cluster"
    }
    scenario_4 = {
      Pattern     = "DatabaseFailover"
      FailoverType = "WarmSpare"
      Scenario    = "4-Failover"
    }
  }
}

