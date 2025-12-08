# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - CONFIGURACIÓN MÍNIMA (PRESUPUESTO ~$50-80/mes)
# ═══════════════════════════════════════════════════════════════════════════════
# Optimizada para AWS Free Tier / créditos educativos de $100
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# GENERAL
# ─────────────────────────────────────────────────────────────────────────────
project_name = "neumo"
environment  = "dev"
aws_region   = "us-east-1"

# ─────────────────────────────────────────────────────────────────────────────
# NETWORKING - OPTIMIZADO PARA COSTOS
# ─────────────────────────────────────────────────────────────────────────────
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

# ⚠️ IMPORTANTE: NAT Gateway cuesta ~$32/mes
# Para ahorrar, usamos solo 1 NAT Gateway compartido
enable_nat_gateway = true
single_nat_gateway = true  # AHORRO: ~$32/mes menos

# ─────────────────────────────────────────────────────────────────────────────
# RDS - AUTH DATABASE (FREE TIER ELEGIBLE)
# ─────────────────────────────────────────────────────────────────────────────
db_name     = "auth_db"
db_username = "postgres"
db_password = "NeumoSecure2024!"  # ⚠️ CAMBIAR EN PRODUCCIÓN

# db.t3.micro es elegible para Free Tier (750 horas/mes gratis por 12 meses)
rds_instance_class        = "db.t3.micro"
rds_allocated_storage     = 20  # Free Tier incluye 20GB
rds_max_allocated_storage = 20  # Sin auto-scaling para ahorrar
rds_multi_az              = false  # AHORRO: Multi-AZ duplica el costo

# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTDB - PREDIAGNOSTIC DATABASE 
# ⚠️ DocumentDB NO tiene Free Tier - es el más caro (~$57/mes)
# ALTERNATIVA: Podrías usar MongoDB en un contenedor ECS (~$15/mes)
# ─────────────────────────────────────────────────────────────────────────────
docdb_master_username = "neumo_docdb"
docdb_master_password = "NeumoDocDB2024!"  # ⚠️ CAMBIAR

docdb_instance_class = "db.t3.medium"  # Mínimo soportado
docdb_instance_count = 1  # Solo 1 instancia para ahorrar

# ─────────────────────────────────────────────────────────────────────────────
# AMAZON MQ - RABBITMQ
# ─────────────────────────────────────────────────────────────────────────────
mq_username = "neumo_mq"
mq_password = "NeumoMQ2024!"  # ⚠️ CAMBIAR

mq_instance_type   = "mq.t3.micro"  # El más pequeño (~$22/mes)
mq_deployment_mode = "SINGLE_INSTANCE"  # Sin HA para ahorrar

# ─────────────────────────────────────────────────────────────────────────────
# SMTP - NOTIFICATION SERVICE
# ─────────────────────────────────────────────────────────────────────────────
smtp_host     = "smtp.mailgun.org"
smtp_port     = 587
smtp_username = "postmaster@your-domain.mailgun.org"  # ⚠️ CAMBIAR
smtp_password = "YOUR_SMTP_PASSWORD"  # ⚠️ CAMBIAR
email_from    = "notification@neumodiagnostics.com"

# ─────────────────────────────────────────────────────────────────────────────
# ECS - CONFIGURACIÓN MÍNIMA
# ─────────────────────────────────────────────────────────────────────────────

# API GATEWAY - Reducido de 3 a 1 tarea (Hot Spare demo con auto-scaling)
api_gateway_desired_count = 1  # Mínimo, escala automáticamente
api_gateway_cpu           = 256  # 0.25 vCPU
api_gateway_memory        = 512  # 0.5 GB
api_gateway_min_capacity  = 1
api_gateway_max_capacity  = 3   # Puede escalar hasta 3 si hay carga

# AUTH BACKEND - Mínimo
auth_be_desired_count = 1
auth_be_cpu           = 256
auth_be_memory        = 512

# PREDIAGNOSTIC BACKEND - Reducido (N+1 demo)
prediagnostic_be_desired_count = 2  # Mínimo para demostrar N+1
prediagnostic_be_cpu           = 512  # 0.5 vCPU (ML necesita más)
prediagnostic_be_memory        = 1024  # 1 GB
prediagnostic_min_capacity     = 2
prediagnostic_max_capacity     = 4

# NOTIFICATION BACKEND (Worker)
notification_be_desired_count = 1
notification_be_cpu           = 256
notification_be_memory        = 512

# MESSAGE PRODUCER
message_producer_desired_count = 1
message_producer_cpu           = 256
message_producer_memory        = 512

# WEB FRONTEND
web_frontend_desired_count = 1
web_frontend_cpu           = 256
web_frontend_memory        = 512

# ─────────────────────────────────────────────────────────────────────────────
# DOMINIO (OPCIONAL - Gratis si no usas)
# ─────────────────────────────────────────────────────────────────────────────
domain_name     = ""
create_dns_zone = false

# ─────────────────────────────────────────────────────────────────────────────
# TAGS
# ─────────────────────────────────────────────────────────────────────────────
additional_tags = {
  Course  = "Software Architecture"
  Team    = "NeumoDiagnostics"
  Owner   = "student@university.edu"
  Budget  = "minimal"
}
