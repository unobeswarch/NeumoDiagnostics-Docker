# 🏗️ NeumoDiagnostics - Infraestructura AWS con Terraform

## 📋 Descripción

Este directorio contiene la infraestructura como código (IaC) para desplegar NeumoDiagnostics en AWS usando Terraform. La arquitectura implementa **4 patrones de disponibilidad** requeridos para el curso de Arquitectura de Software.

## 🎯 Patrones de Disponibilidad Implementados

| Escenario | Patrón | Componente | Implementación |
|-----------|--------|------------|----------------|
| **1** | Replication (Hot Spare) | API Gateway | 3+ tareas ECS con ALB |
| **2** | Service Discovery | Todos los servicios | AWS Cloud Map |
| **3** | Cluster Pattern | Prediagnostic Backend | ECS Multi-AZ + Autoscaling N+1 |
| **4** | Database Failover (Warm Spare) | Auth Database | RDS PostgreSQL Multi-AZ |

## 📁 Estructura del Proyecto

```
infra/
├── ARCHITECTURE.md          # Documentación detallada de arquitectura
├── README.md                 # Este archivo
├── main.tf                   # Configuración principal
├── providers.tf              # Providers y backend
├── variables.tf              # Variables globales
├── outputs.tf                # Outputs principales
├── locals.tf                 # Valores locales computados
│
├── modules/                  # Módulos reutilizables
│   ├── network/              # VPC, subnets, NAT, routing
│   ├── ecs-cluster/          # Cluster ECS con Fargate
│   ├── ecs-service/          # Servicio ECS genérico
│   ├── alb/                  # Application Load Balancer
│   ├── rds/                  # RDS PostgreSQL Multi-AZ
│   ├── documentdb/           # DocumentDB (MongoDB)
│   ├── mq/                   # Amazon MQ (RabbitMQ)
│   ├── ecr/                  # Container Registry
│   ├── service-discovery/    # AWS Cloud Map
│   └── s3/                   # S3 Buckets
│
└── environments/             # Configuraciones por entorno
    ├── dev/                  # Desarrollo (costos reducidos)
    │   ├── main.tf
    │   └── terraform.tfvars.example
    └── prod/                 # Producción (alta disponibilidad)
        └── main.tf
```

## 🚀 Guía de Inicio Rápido

### Prerrequisitos

1. **AWS CLI** configurado con credenciales
2. **Terraform** >= 1.5.0
3. **Docker** para build de imágenes

### 1. Configurar Variables

```bash
cd infra/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con tus valores
```

### 2. Inicializar Terraform

```bash
terraform init
```

### 3. Revisar el Plan

```bash
terraform plan
```

### 4. Aplicar la Infraestructura

```bash
terraform apply
```

### 5. Build y Push de Imágenes

```bash
# Obtener credenciales de ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build y push de cada servicio
for service in api-gateway auth-be prediagnostic-be notification-be message-producer web-front-end; do
  docker build -t neumo/$service ./$service
  docker tag neumo/$service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/neumo/$service:latest
  docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/neumo/$service:latest
done
```

## 🧪 Pruebas de Patrones de Disponibilidad

### Escenario 1: Hot Spare (API Gateway)

```bash
# Simular fallo de una tarea
aws ecs stop-task --cluster neumo-dev-cluster --task <task-arn>

# Verificar que ALB redirige a tareas saludables
curl -w "%{http_code}" http://<alb-dns>/health

# Verificar que ECS crea nueva tarea automáticamente
aws ecs list-tasks --cluster neumo-dev-cluster --service-name api-gateway
```

### Escenario 2: Service Discovery

```bash
# Ver servicios registrados en Cloud Map
aws servicediscovery list-services --filters Name=NAMESPACE_ID,Values=<namespace-id>

# Desde dentro de la VPC, resolver DNS
dig auth-be.neumo.internal
```

### Escenario 3: Cluster Pattern

```bash
# Ver distribución de tareas entre AZs
aws ecs list-tasks --cluster neumo-dev-cluster --service-name prediagnostic-be

# Forzar escalado manual
aws ecs update-service --cluster neumo-dev-cluster --service prediagnostic-be --desired-count 6

# Ver métricas de autoscaling
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=prediagnostic-be Name=ClusterName,Value=neumo-dev-cluster \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

### Escenario 4: Database Failover (Warm Spare)

```bash
# Verificar configuración Multi-AZ
aws rds describe-db-instances --db-instance-identifier neumo-dev-auth-db \
  --query 'DBInstances[0].{MultiAZ:MultiAZ,AZ:AvailabilityZone}'

# Simular failover (CUIDADO: causa ~60-120s de downtime)
aws rds reboot-db-instance --db-instance-identifier neumo-dev-auth-db --force-failover

# Monitorear evento de failover
aws rds describe-events --source-identifier neumo-dev-auth-db --source-type db-instance
```

## 💰 Estimación de Costos

### Desarrollo (~$150/mes)

| Servicio | Configuración | Costo |
|----------|---------------|-------|
| ECS Fargate | ~3 tareas | ~$40 |
| RDS PostgreSQL | db.t3.micro, Single-AZ | ~$15 |
| DocumentDB | db.t3.medium, 1 instancia | ~$50 |
| Amazon MQ | mq.t3.micro, Single | ~$20 |
| NAT Gateway | 1 gateway | ~$30 |
| Otros | ALB, S3, CloudWatch | ~$25 |

### Producción (~$500/mes)

| Servicio | Configuración | Costo |
|----------|---------------|-------|
| ECS Fargate | ~10 tareas | ~$120 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | ~$75 |
| DocumentDB | db.t3.medium, 2 instancias | ~$140 |
| Amazon MQ | mq.t3.micro, Active/Standby | ~$40 |
| NAT Gateway | 2-3 gateways | ~$90 |
| Otros | ALB, S3, CloudWatch | ~$35 |

## 🔧 Comandos Útiles

```bash
# Ver estado de la infraestructura
terraform show

# Ver outputs
terraform output

# Ver resumen de patrones implementados
terraform output availability_patterns_summary

# Destruir infraestructura (CUIDADO!)
terraform destroy

# Actualizar un solo módulo
terraform apply -target=module.ecs_service_api_gateway
```

## 📚 Documentación Adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Documentación completa de arquitectura
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## 🤝 Soporte

Para problemas o preguntas sobre la infraestructura, revisar primero:

1. Los logs de CloudWatch en `/ecs/neumo-*`
2. Los eventos de ECS en la consola de AWS
3. Las métricas de CloudWatch para identificar cuellos de botella

---

**Arquitectura diseñada para el curso de Arquitectura de Software**  
*Implementando patrones de disponibilidad: Hot Spare, Service Discovery, Cluster Pattern, Database Failover*

