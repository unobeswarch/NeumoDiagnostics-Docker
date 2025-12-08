# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO: SERVICE DISCOVERY (AWS CLOUD MAP)
# ═══════════════════════════════════════════════════════════════════════════════
# Implementa el Escenario 2: Service Discovery Pattern
# Los microservicios se registran automáticamente y se descubren por DNS
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# NAMESPACE PRIVADO DNS
# Crea la zona DNS privada para service discovery interno
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = var.namespace_name
  description = "Service discovery namespace for ${var.name_prefix}"
  vpc         = var.vpc_id

  tags = merge(var.tags, {
    Name     = "${var.name_prefix}-namespace"
    Pattern  = "ServiceDiscovery"
    Scenario = "2-ServiceDiscovery"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICIOS EN CLOUD MAP
# Cada servicio se registra con su nombre DNS
# Ejemplo: auth-be.neumo.internal → IP de la tarea ECS
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_service_discovery_service" "services" {
  for_each = var.services

  name = each.key

  dns_config {
    namespace_id   = aws_service_discovery_private_dns_namespace.main.id
    routing_policy = "MULTIVALUE"  # Múltiples IPs para balanceo DNS

    dns_records {
      ttl  = var.dns_ttl
      type = "A"
    }
  }

  # Health check personalizado (ECS lo gestiona)
  health_check_custom_config {
    failure_threshold = var.failure_threshold
  }

  tags = merge(var.tags, {
    Name     = "${var.name_prefix}-${each.key}"
    Service  = each.key
    Port     = each.value.port
    Pattern  = "ServiceDiscovery"
    Scenario = "2-ServiceDiscovery"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# OUTPUTS PARA USO EN ECS SERVICES
# ─────────────────────────────────────────────────────────────────────────────
# Los ECS Services usan service_registries para auto-registro

