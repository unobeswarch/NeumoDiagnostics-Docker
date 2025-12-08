variable "name_prefix" {
  description = "Prefijo para nombrar recursos"
  type        = string
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
}

variable "cluster_id" {
  description = "ID del cluster ECS"
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "subnet_ids" {
  description = "IDs de las subnets privadas"
  type        = list(string)
}

variable "cpu" {
  description = "CPU para la tarea RabbitMQ (en unidades de Fargate)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memoria para la tarea RabbitMQ (en MB)"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Número de tareas RabbitMQ"
  type        = number
  default     = 1
}

variable "rabbitmq_user" {
  description = "Usuario de RabbitMQ"
  type        = string
  default     = "guest"
}

variable "rabbitmq_password" {
  description = "Contraseña de RabbitMQ"
  type        = string
  sensitive   = true
  default     = "guest"
}

variable "execution_role_arn" {
  description = "ARN del rol de ejecución de tareas ECS"
  type        = string
}

variable "task_role_arn" {
  description = "ARN del rol de tareas ECS"
  type        = string
}

variable "log_group_name" {
  description = "Nombre del grupo de logs de CloudWatch"
  type        = string
}

variable "service_discovery_arn" {
  description = "ARN del servicio de Cloud Map"
  type        = string
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks permitidos para acceder a RabbitMQ"
  type        = list(string)
}

variable "tags" {
  description = "Tags adicionales para los recursos"
  type        = map(string)
  default     = {}
}
