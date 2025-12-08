# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - VARIABLES GLOBALES
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# GENERAL
# ─────────────────────────────────────────────────────────────────────────────
variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "neumo"
}

variable "environment" {
  description = "Entorno de despliegue (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment debe ser dev, staging o prod."
  }
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

# ─────────────────────────────────────────────────────────────────────────────
# NETWORKING
# ─────────────────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block para la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Zonas de disponibilidad a usar"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDRs para subnets públicas"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDRs para subnets privadas"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "enable_nat_gateway" {
  description = "Habilitar NAT Gateway (true para prod, false para dev barato)"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Usar un solo NAT Gateway (ahorro de costos en dev)"
  type        = bool
  default     = false
}

# ─────────────────────────────────────────────────────────────────────────────
# ECS CLUSTER
# ─────────────────────────────────────────────────────────────────────────────
variable "enable_container_insights" {
  description = "Habilitar Container Insights en ECS"
  type        = bool
  default     = true
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICIOS - API GATEWAY
# ─────────────────────────────────────────────────────────────────────────────
variable "api_gateway_desired_count" {
  description = "Número deseado de tareas API Gateway (Hot Spare)"
  type        = number
  default     = 3
}

variable "api_gateway_cpu" {
  description = "CPU para API Gateway (256 = 0.25 vCPU)"
  type        = number
  default     = 512
}

variable "api_gateway_memory" {
  description = "Memoria para API Gateway en MB"
  type        = number
  default     = 1024
}

variable "api_gateway_min_capacity" {
  description = "Capacidad mínima de auto-scaling"
  type        = number
  default     = 2
}

variable "api_gateway_max_capacity" {
  description = "Capacidad máxima de auto-scaling"
  type        = number
  default     = 6
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICIOS - AUTH BACKEND
# ─────────────────────────────────────────────────────────────────────────────
variable "auth_be_desired_count" {
  description = "Número deseado de tareas Auth Backend"
  type        = number
  default     = 2
}

variable "auth_be_cpu" {
  description = "CPU para Auth Backend"
  type        = number
  default     = 256
}

variable "auth_be_memory" {
  description = "Memoria para Auth Backend en MB"
  type        = number
  default     = 512
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICIOS - PREDIAGNOSTIC BACKEND
# ─────────────────────────────────────────────────────────────────────────────
variable "prediagnostic_be_desired_count" {
  description = "Número deseado de tareas Prediagnostic (Cluster Pattern)"
  type        = number
  default     = 4
}

variable "prediagnostic_be_cpu" {
  description = "CPU para Prediagnostic Backend (ML workload)"
  type        = number
  default     = 1024
}

variable "prediagnostic_be_memory" {
  description = "Memoria para Prediagnostic Backend en MB"
  type        = number
  default     = 2048
}

variable "prediagnostic_min_capacity" {
  description = "Capacidad mínima de auto-scaling (N+1 pattern)"
  type        = number
  default     = 4
}

variable "prediagnostic_max_capacity" {
  description = "Capacidad máxima de auto-scaling"
  type        = number
  default     = 10
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICIOS - NOTIFICATION BACKEND
# ─────────────────────────────────────────────────────────────────────────────
variable "notification_be_desired_count" {
  description = "Número deseado de workers de notificación"
  type        = number
  default     = 2
}

variable "notification_be_cpu" {
  description = "CPU para Notification Backend"
  type        = number
  default     = 256
}

variable "notification_be_memory" {
  description = "Memoria para Notification Backend en MB"
  type        = number
  default     = 512
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICIOS - MESSAGE PRODUCER
# ─────────────────────────────────────────────────────────────────────────────
variable "message_producer_desired_count" {
  description = "Número deseado de tareas Message Producer"
  type        = number
  default     = 2
}

variable "message_producer_cpu" {
  description = "CPU para Message Producer"
  type        = number
  default     = 256
}

variable "message_producer_memory" {
  description = "Memoria para Message Producer en MB"
  type        = number
  default     = 512
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICIOS - WEB FRONTEND
# ─────────────────────────────────────────────────────────────────────────────
variable "web_frontend_desired_count" {
  description = "Número deseado de tareas Web Frontend"
  type        = number
  default     = 2
}

variable "web_frontend_cpu" {
  description = "CPU para Web Frontend"
  type        = number
  default     = 512
}

variable "web_frontend_memory" {
  description = "Memoria para Web Frontend en MB"
  type        = number
  default     = 1024
}

# ─────────────────────────────────────────────────────────────────────────────
# RDS - AUTH DATABASE
# ─────────────────────────────────────────────────────────────────────────────
variable "rds_instance_class" {
  description = "Clase de instancia RDS"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "Almacenamiento asignado en GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "Almacenamiento máximo para auto-scaling"
  type        = number
  default     = 100
}

variable "rds_multi_az" {
  description = "Habilitar Multi-AZ para RDS (Warm Spare Pattern)"
  type        = bool
  default     = true
}

variable "db_username" {
  description = "Usuario maestro de la base de datos"
  type        = string
  default     = "neumo_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Contraseña del usuario maestro (set via TF_VAR_db_password)"
  type        = string
  sensitive   = true
  default     = "Nm0Auth#Dev2024$X"  # Default for dev, override in production
}

variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
  default     = "auth_db"
}

# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTDB - PREDIAGNOSTIC DATABASE
# ─────────────────────────────────────────────────────────────────────────────
variable "docdb_instance_class" {
  description = "Clase de instancia DocumentDB"
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "Número de instancias en el cluster DocumentDB"
  type        = number
  default     = 2
}

variable "docdb_master_username" {
  description = "Usuario maestro de DocumentDB"
  type        = string
  default     = "neumo_docdb"
  sensitive   = true
}

variable "docdb_master_password" {
  description = "Contraseña del usuario maestro DocumentDB (not used - using MongoDB ECS)"
  type        = string
  sensitive   = true
  default     = "NotUsed123!"  # Not used - MongoDB ECS doesn't require auth in dev
}

# ─────────────────────────────────────────────────────────────────────────────
# AMAZON MQ - MESSAGE BROKER
# ─────────────────────────────────────────────────────────────────────────────
variable "mq_instance_type" {
  description = "Tipo de instancia Amazon MQ"
  type        = string
  default     = "mq.t3.micro"
}

variable "mq_deployment_mode" {
  description = "Modo de despliegue (SINGLE_INSTANCE o ACTIVE_STANDBY_MULTI_AZ)"
  type        = string
  default     = "ACTIVE_STANDBY_MULTI_AZ"
}

variable "mq_username" {
  description = "Usuario de RabbitMQ"
  type        = string
  default     = "neumo_mq"
  sensitive   = true
}

variable "mq_password" {
  description = "Contraseña de RabbitMQ (not used - using RabbitMQ ECS with guest/guest)"
  type        = string
  sensitive   = true
  default     = "guest"  # RabbitMQ ECS uses guest/guest like docker-compose
}

# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATION SERVICE (SMTP)
# ─────────────────────────────────────────────────────────────────────────────
variable "smtp_host" {
  description = "Host SMTP (ej: smtp.mailgun.org)"
  type        = string
  default     = "smtp.mailgun.org"
}

variable "smtp_port" {
  description = "Puerto SMTP"
  type        = number
  default     = 587
}

variable "smtp_username" {
  description = "Usuario SMTP"
  type        = string
  sensitive   = true
}

variable "smtp_password" {
  description = "Contraseña SMTP (optional - set via TF_VAR_smtp_password)"
  type        = string
  sensitive   = true
  default     = ""  # Optional - email notifications won't work without this
}

variable "email_from" {
  description = "Email remitente"
  type        = string
  default     = "notification@neudiagnostics.dadames.tech"
}

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN (OPCIONAL)
# ─────────────────────────────────────────────────────────────────────────────
variable "domain_name" {
  description = "Nombre de dominio para la aplicación (opcional)"
  type        = string
  default     = ""
}

variable "create_dns_zone" {
  description = "Crear zona DNS en Route 53"
  type        = bool
  default     = false
}

# ─────────────────────────────────────────────────────────────────────────────
# TAGS ADICIONALES
# ─────────────────────────────────────────────────────────────────────────────
variable "additional_tags" {
  description = "Tags adicionales para todos los recursos"
  type        = map(string)
  default     = {}
}

