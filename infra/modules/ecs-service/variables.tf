# ═══════════════════════════════════════════════════════════════════════════════
# MÓDULO ECS SERVICE - VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# IDENTIFICACIÓN
# ─────────────────────────────────────────────────────────────────────────────
variable "name_prefix" {
  description = "Prefijo para nombres de recursos"
  type        = string
}

variable "service_name" {
  description = "Nombre del servicio"
  type        = string
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
}

# ─────────────────────────────────────────────────────────────────────────────
# CLUSTER
# ─────────────────────────────────────────────────────────────────────────────
variable "cluster_id" {
  description = "ID del cluster ECS"
  type        = string
}

variable "cluster_name" {
  description = "Nombre del cluster ECS"
  type        = string
}

# ─────────────────────────────────────────────────────────────────────────────
# CONTENEDOR
# ─────────────────────────────────────────────────────────────────────────────
variable "container_image" {
  description = "URI de la imagen Docker"
  type        = string
}

variable "container_port" {
  description = "Puerto del contenedor (null para workers sin puerto)"
  type        = number
  default     = null
}

variable "cpu" {
  description = "CPU en unidades (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memoria en MB"
  type        = number
  default     = 512
}

# ─────────────────────────────────────────────────────────────────────────────
# IAM
# ─────────────────────────────────────────────────────────────────────────────
variable "execution_role_arn" {
  description = "ARN del rol de ejecución de tareas"
  type        = string
}

variable "task_role_arn" {
  description = "ARN del rol de tareas (runtime)"
  type        = string
}

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN DE DESPLIEGUE
# ─────────────────────────────────────────────────────────────────────────────
variable "desired_count" {
  description = "Número deseado de tareas (Hot Spare: >= 2)"
  type        = number
  default     = 2
}

variable "minimum_healthy_percent" {
  description = "Porcentaje mínimo de tareas saludables durante deploy"
  type        = number
  default     = 100
}

# ─────────────────────────────────────────────────────────────────────────────
# NETWORKING
# ─────────────────────────────────────────────────────────────────────────────
variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "subnet_ids" {
  description = "IDs de las subnets (Multi-AZ)"
  type        = list(string)
}

variable "assign_public_ip" {
  description = "Asignar IP pública (solo si no hay NAT Gateway)"
  type        = bool
  default     = false
}

variable "allowed_security_groups" {
  description = "Security groups permitidos para ingreso"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks permitidos para ingreso"
  type        = list(string)
  default     = []
}

# ─────────────────────────────────────────────────────────────────────────────
# VARIABLES DE ENTORNO
# ─────────────────────────────────────────────────────────────────────────────
variable "environment_variables" {
  description = "Variables de entorno para el contenedor"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secrets" {
  description = "Secretos desde Secrets Manager o Parameter Store"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

# ─────────────────────────────────────────────────────────────────────────────
# LOGS
# ─────────────────────────────────────────────────────────────────────────────
variable "log_group_name" {
  description = "Nombre del log group de CloudWatch"
  type        = string
}

# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────
variable "health_check_command" {
  description = "Comando de health check del contenedor"
  type        = list(string)
  default     = null
}

variable "health_check_start_period" {
  description = "Período de gracia para health check (segundos)"
  type        = number
  default     = 60
}

variable "health_check_grace_period" {
  description = "Período de gracia antes de que ALB chequee salud"
  type        = number
  default     = 60
}

# ─────────────────────────────────────────────────────────────────────────────
# LOAD BALANCER
# ─────────────────────────────────────────────────────────────────────────────
variable "target_group_arn" {
  description = "ARN del target group del ALB"
  type        = string
  default     = null
}

variable "alb_listener_arn" {
  description = "ARN del listener del ALB (dependencia)"
  type        = string
  default     = null
}

variable "alb_resource_label" {
  description = "Resource label del ALB para auto-scaling"
  type        = string
  default     = null
}

# ─────────────────────────────────────────────────────────────────────────────
# SERVICE DISCOVERY (Escenario 2)
# ─────────────────────────────────────────────────────────────────────────────
variable "service_discovery_arn" {
  description = "ARN del servicio en Cloud Map"
  type        = string
  default     = null
}

# ─────────────────────────────────────────────────────────────────────────────
# AUTO SCALING (Escenario 3)
# ─────────────────────────────────────────────────────────────────────────────
variable "enable_autoscaling" {
  description = "Habilitar auto-scaling"
  type        = bool
  default     = true
}

variable "min_capacity" {
  description = "Capacidad mínima (N+1: mantener al menos 2)"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Capacidad máxima"
  type        = number
  default     = 4
}

variable "cpu_target_value" {
  description = "Objetivo de utilización de CPU (%)"
  type        = number
  default     = 70
}

variable "enable_memory_scaling" {
  description = "Habilitar escalado por memoria"
  type        = bool
  default     = false
}

variable "memory_target_value" {
  description = "Objetivo de utilización de memoria (%)"
  type        = number
  default     = 70
}

variable "requests_target_value" {
  description = "Objetivo de requests por target"
  type        = number
  default     = 1000
}

variable "scale_in_cooldown" {
  description = "Cooldown para scale in (segundos)"
  type        = number
  default     = 300
}

variable "scale_out_cooldown" {
  description = "Cooldown para scale out (segundos)"
  type        = number
  default     = 60
}

# ─────────────────────────────────────────────────────────────────────────────
# TAGS
# ─────────────────────────────────────────────────────────────────────────────
variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}

