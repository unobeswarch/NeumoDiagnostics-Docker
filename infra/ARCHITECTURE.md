# NeumoDiagnostics - Arquitectura AWS con Terraform

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de Microservicios](#análisis-de-microservicios)
3. [Arquitectura AWS Propuesta](#arquitectura-aws-propuesta)
4. [Patrones de Disponibilidad](#patrones-de-disponibilidad)
5. [Mapeo Docker → AWS](#mapeo-docker--aws)
6. [Trade-offs y Decisiones](#trade-offs-y-decisiones)
7. [Pruebas y Validación](#pruebas-y-validación)

---

## 🎯 Resumen Ejecutivo

**NeumoDiagnostics** es un sistema de diagnóstico médico basado en microservicios que utiliza ML para análisis de radiografías pulmonares. La arquitectura AWS propuesta implementa **4 patrones de disponibilidad** requeridos para el curso de Arquitectura de Software:

| Patrón | Implementación | Componente Principal |
|--------|---------------|---------------------|
| **Replication (Hot Spare)** | ECS Multi-AZ + ALB | API Gateway |
| **Service Discovery** | AWS Cloud Map | Todos los servicios |
| **Cluster Pattern** | ECS Fargate Multi-AZ | Prediagnostic Backend |
| **Database Failover** | RDS Multi-AZ | Auth Database |

---

## 🔍 Análisis de Microservicios

### Servicios Identificados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NEUMO DIAGNOSTICS SERVICES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │  web-front-end  │     │  cli-front-end  │                               │
│  │  (Next.js)      │     │  (Rust CLI)     │                               │
│  │  Puerto: 3000   │     │                 │                               │
│  │  EXPUESTO (AWS) │     │  ⚠️ SOLO LOCAL  │  ◄── Se ejecuta en PC del    │
│  └────────┬────────┘     │  No se despliega│      usuario, NO en AWS      │
│           │              │  en la nube     │                               │
│           │              └─────────────────┘                               │
│           │                                                                 │
│           │              ┌─────────────────┐                               │
│           │              │  reverse-proxy  │  ◄── En AWS se reemplaza     │
│           │              │  (Nginx)        │      por Application Load    │
│           │              │  Puerto: 80     │      Balancer (ALB)          │
│           │              └────────┬────────┘                               │
│           │                       │                                        │
│           └───────────────────────┤                                        │
│                                   ▼                                        │
│           ┌────────────────────────────────────────────────┐               │
│           │              API GATEWAY (Go)                  │               │
│           │   3 instancias con weighted round-robin        │               │
│           │   Puerto: 8080  |  CRÍTICO                     │               │
│           └────────────────────────────────────────────────┘               │
│                    │              │              │                         │
│           ┌────────┴──────┐      │       ┌──────┴────────┐                │
│           ▼               │      │       ▼               │                │
│  ┌─────────────────┐      │      │   ┌─────────────────┐ │                │
│  │    auth-be      │      │      │   │ prediagnostic-be│ │                │
│  │    (Go)         │      │      │   │   (Python/ML)   │ │                │
│  │  Puerto: 8081   │      │      │   │  Puerto: 8000   │ │                │
│  │  INTERNO        │      │      │   │  INTERNO        │ │                │
│  └────────┬────────┘      │      │   └────────┬────────┘ │                │
│           │               │      │            │          │                │
│           ▼               │      │            ▼          │                │
│  ┌─────────────────┐      │      │   ┌─────────────────┐ │                │
│  │    auth-db      │      │      │   │ prediagnostic-db│ │                │
│  │  (PostgreSQL)   │      │      │   │   (MongoDB)     │ │                │
│  └─────────────────┘      │      │   └─────────────────┘ │                │
│                           │      │                       │                │
│           ┌───────────────┴──────┴───────────────────────┘                │
│           ▼                                                                │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│  │ message-producer│────▶│ message-broker  │────▶│ notification-be │      │
│  │    (Go)         │     │  (RabbitMQ)     │     │   (Python)      │      │
│  │  Puerto: 8082   │     │  Puerto: 5672   │     │  WORKER         │      │
│  │  INTERNO        │     │  INTERNO        │     │  INTERNO        │      │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Nota sobre CLI Frontend**: El `cli-front-end` es una aplicación de línea de comandos
> en Rust que los desarrolladores/médicos ejecutan **localmente** en su computadora.
> No se despliega en AWS. Conecta directamente a la URL pública del ALB.

### Clasificación de Servicios

| Servicio | Tipo | Criticidad | Exposición | Puerto | Tecnología | AWS |
|----------|------|------------|------------|--------|------------|-----|
| **web-front-end** | Frontend | 🟡 ALTO | **Público (ALB)** | 3000 | Next.js | ✅ ECS + ALB |
| **api-gateway** | Core | 🔴 CRÍTICO | **Público (ALB)** | 8080 | Go/GraphQL | ✅ ECS + ALB |
| **auth-be** | Core | 🔴 CRÍTICO | Interno (Cloud Map) | 8081 | Go | ✅ ECS |
| **prediagnostic-be** | Core | 🔴 CRÍTICO | Interno (Cloud Map) | 8000 | Python/TensorFlow | ✅ ECS |
| **message-producer** | Soporte | 🟢 MEDIO | Interno (Cloud Map) | 8082 | Go | ✅ ECS |
| **notification-be** | Soporte | 🟢 MEDIO | Interno (Cloud Map) | Worker | Python | ✅ ECS |
| **cli-front-end** | Cliente | 🟢 BAJO | Local (PC usuario) | - | Rust | ❌ No desplegado |
| **message-broker** | Infraestructura | 🟡 ALTO | Interno | 5672 | RabbitMQ | ✅ Amazon MQ |
| **auth-db** | Data | 🔴 CRÍTICO | Interno | 5432 | PostgreSQL | ✅ RDS Multi-AZ |
| **prediagnostic-db** | Data | 🔴 CRÍTICO | Interno | 27017 | MongoDB | ✅ DocumentDB |

### Dependencias Entre Servicios

```
                              ┌─────────────────────────────────────────────────┐
                              │              APPLICATION LOAD BALANCER          │
                              │                    (Público)                    │
                              └──────────┬─────────────────────┬────────────────┘
                                         │                     │
                           ┌─────────────┘                     └─────────────┐
                           ▼                                                 ▼
                    ┌─────────────┐                                   ┌─────────────┐
 Navegador ────────►│ web-frontend│                                   │ api-gateway │◄──── CLI local
                    │  (Next.js)  │───── HTTP/HTTPS ─────────────────►│    (Go)     │
                    └─────────────┘     (via ALB DNS)                 └──────┬──────┘
                                                                             │
                                                    ┌────────────────────────┼────────────────────────┐
                                                    │                        │                        │
                                                    ▼                        ▼                        ▼
                    ┌──────────────────────────────────────────────────────────────────────────────────────┐
                    │                           AWS CLOUD MAP (Service Discovery)                          │
                    │                                neumo.internal                                        │
                    └──────────────────────────────────────────────────────────────────────────────────────┘
                                                    │                        │                        │
                                                    ▼                        ▼                        ▼
                                             ┌───────────┐            ┌───────────┐            ┌───────────┐
                                             │  auth-be  │            │prediag-be │            │msg-producer│
                                             │   (Go)    │            │ (Python)  │            │   (Go)    │
                                             └─────┬─────┘            └─────┬─────┘            └─────┬─────┘
                                                   │                        │                        │
                                                   ▼                        ▼                        ▼
                                             ┌───────────┐            ┌───────────┐            ┌───────────┐
                                             │   RDS     │            │ DocumentDB│            │ Amazon MQ │
                                             │PostgreSQL │            │ (MongoDB) │            │ RabbitMQ  │
                                             └───────────┘            └───────────┘            └─────┬─────┘
                                                                                                     │
                                                                                                     ▼
                                                                                               ┌───────────┐
                                                                                               │notific-be │
                                                                                               │ (Worker)  │
                                                                                               └─────┬─────┘
                                                                                                     │
                                                                                                     ▼
                                                                                               ┌───────────┐
                                                                                               │   SMTP    │
                                                                                               │ (Mailgun) │
                                                                                               └───────────┘
```

---

## 🏗️ Arquitectura AWS Propuesta

### Diagrama de Flujo de Tráfico (desde perspectiva del usuario)

```
═══════════════════════════════════════════════════════════════════════════════════
                         FLUJO DE LA APLICACIÓN
═══════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NAVEGADOR DEL USUARIO                              │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         WEB FRONTEND                                    │   │
│   │                    (Next.js ejecutándose en el navegador)               │   │
│   │                                                                         │   │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │   │
│   │   │   Página    │    │   Página    │    │   Página    │                │   │
│   │   │   Login     │    │  Dashboard  │    │  Pacientes  │                │   │
│   │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                │   │
│   │          │                  │                  │                        │   │
│   │          │ fetch()          │ fetch()          │ fetch()                │   │
│   │          │ '/auth/login'    │ '/graphql'       │ '/prediagnostic/...'  │   │
│   │          │                  │                  │                        │   │
│   └──────────┼──────────────────┼──────────────────┼────────────────────────┘   │
│              │                  │                  │                            │
│              └──────────────────┴──────────────────┘                            │
│                                 │                                               │
│                                 │  Peticiones HTTP desde el Frontend            │
│                                 │  (el JS hace fetch a la URL del ALB)          │
└─────────────────────────────────┼───────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LOAD BALANCER                                │
│                          (alb.amazonaws.com)                                    │
│                                                                                 │
│   Recibe peticiones del Frontend y las enruta:                                 │
│                                                                                 │
│   /auth/*, /graphql, /api/*  ──────────────────►  API GATEWAY                  │
│   /prediagnostic/*, /upload                                                    │
│                                                                                 │
└─────────────────────────────────┬───────────────────────────────────────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │                               │
                  │         API GATEWAY           │
                  │            (Go)               │
                  │                               │
                  │   Procesa las peticiones      │
                  │   que vienen del Frontend     │
                  │                               │
                  └───────────────┬───────────────┘
                                  │
                                  │ Llama a servicios internos
                                  │ via Cloud Map (DNS privado)
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            AWS CLOUD MAP                                        │
│                    (Service Discovery - neumo.internal)                         │
│                                                                                 │
│    API Gateway hace peticiones HTTP a:                                         │
│                                                                                 │
│    http://auth-be.neumo.internal:8081         →  Auth Backend                  │
│    http://prediagnostic-be.neumo.internal:8000 →  Prediagnostic Backend        │
│    http://message-producer.neumo.internal:8082 →  Message Producer             │
│                                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│   │    auth-be      │  │ prediagnostic-be│  │ message-producer│                │
│   │    (Go)         │  │   (Python/ML)   │  │     (Go)        │                │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                │
│            │                    │                    │                         │
│            ▼                    ▼                    ▼                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│   │ RDS PostgreSQL  │  │   DocumentDB    │  │   Amazon MQ     │                │
│   │   Multi-AZ      │  │   (MongoDB)     │  │   (RabbitMQ)    │                │
│   │  (Escenario 4)  │  │                 │  └────────┬────────┘                │
│   └─────────────────┘  └─────────────────┘           │                         │
│                                                      ▼                         │
│                                            ┌─────────────────┐                 │
│                                            │ notification-be │                 │
│                                            │   (Worker)      │                 │
│                                            │       ↓         │                 │
│                                            │  Envía emails   │                 │
│                                            └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════
                              RESUMEN DEL FLUJO
═══════════════════════════════════════════════════════════════════════════════════

  NAVEGADOR                                                              
  (Frontend)            ALB              API Gateway        Backends
      │                  │                    │                │
      │                  │                    │                │
      │  fetch('/auth')  │                    │                │
      ├─────────────────►├───────────────────►│                │
      │                  │                    ├───────────────►│
      │                  │                    │◄───────────────┤
      │◄─────────────────┤◄───────────────────┤                │
      │   JSON response  │                    │                │
      │                  │                    │                │
      │  fetch('/graphql')                    │                │
      ├─────────────────►├───────────────────►│                │
      │                  │                    ├───────────────►│
      │                  │                    │◄───────────────┤
      │◄─────────────────┤◄───────────────────┤                │
      │   JSON response  │                    │                │
      │                  │                    │                │

  ════════════════════════════════════════════════════════════════════════
  IMPORTANTE: Next.js usa Server Actions ("use server")
  
  Las peticiones fetch() se ejecutan en el SERVIDOR de Next.js (ECS),
  NO en el navegador. Por eso el frontend puede usar Cloud Map
  para llamar al API Gateway internamente.
  
  Flujo real:
  1. Navegador → Next.js Server (renderiza página)
  2. Usuario hace click → JavaScript llama Server Action  
  3. Server Action (en ECS) → Cloud Map → API Gateway
  4. API Gateway → Cloud Map → Backends
  ════════════════════════════════════════════════════════════════════════
```

### Flujo Detallado con Next.js Server Actions

```
═══════════════════════════════════════════════════════════════════════════════════
                    FLUJO REAL CON NEXT.JS SERVER ACTIONS
═══════════════════════════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                              NAVEGADOR                                         │
  │                                                                                │
  │   1. Usuario abre https://app.com/login                                       │
  │   2. Next.js Server renderiza la página y la envía                            │
  │   3. Usuario llena formulario y hace click en "Login"                         │
  │   4. JavaScript del cliente llama a Server Action (RPC al servidor)           │
  │                                                                                │
  └─────────────────────────────────────┬──────────────────────────────────────────┘
                                        │
                                        │  POST /_next/... (Server Action RPC)
                                        │  (NO es fetch a /auth directamente)
                                        ▼
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                              ALB (Público)                                     │
  │                                                                                │
  │   Ruta: /* → web-frontend                                                     │
  │   (Las Server Actions van al mismo contenedor de Next.js)                     │
  │                                                                                │
  └─────────────────────────────────────┬──────────────────────────────────────────┘
                                        │
                                        ▼
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                         WEB FRONTEND (Next.js en ECS)                          │
  │                                                                                │
  │   Server Action ejecuta:                                                       │
  │   ┌──────────────────────────────────────────────────────────────────────┐    │
  │   │  // auth-actions.tsx ("use server")                                  │    │
  │   │  const response = await fetch(                                       │    │
  │   │    `${process.env.SERVER_API_URL}/auth`,  // Cloud Map DNS          │    │
  │   │    { method: "POST", body: JSON.stringify({correo, contrasena}) }   │    │
  │   │  );                                                                  │    │
  │   └──────────────────────────────────────────────────────────────────────┘    │
  │                                                                                │
  └─────────────────────────────────────┬──────────────────────────────────────────┘
                                        │
                                        │  http://api-gateway.neumo.internal:8080/auth
                                        │  (Resolución DNS via Cloud Map)
                                        ▼
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                              AWS CLOUD MAP                                     │
  │                          (neumo.internal namespace)                            │
  │                                                                                │
  │   api-gateway.neumo.internal → 10.0.10.x, 10.0.20.x (IPs de tareas ECS)       │
  │                                                                                │
  └─────────────────────────────────────┬──────────────────────────────────────────┘
                                        │
                                        ▼
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                              API GATEWAY (ECS)                                 │
  │                                                                                │
  │   Procesa /auth y llama a auth-be via Cloud Map:                              │
  │   http://auth-be.neumo.internal:8081/...                                      │
  │                                                                                │
  └─────────────────────────────────────┬──────────────────────────────────────────┘
                                        │
                                        ▼
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                              AUTH-BE (ECS)                                     │
  │                                                                                │
  │   Consulta RDS PostgreSQL, valida credenciales, genera JWT                    │
  │                                                                                │
  └────────────────────────────────────────────────────────────────────────────────┘
```

### Diagrama de Infraestructura por AZ

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    AWS CLOUD                                         │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              VPC (10.0.0.0/16)                                 │ │
│  │                                                                                 │ │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│  │   │                        AVAILABILITY ZONE A                              │  │ │
│  │   │                                                                          │  │ │
│  │   │  ┌──────────────────┐    ┌──────────────────────────────────────────┐   │  │ │
│  │   │  │ Public Subnet A  │    │           Private Subnet A               │   │  │ │
│  │   │  │ (10.0.1.0/24)    │    │           (10.0.10.0/24)                 │   │  │ │
│  │   │  │                  │    │                                          │   │  │ │
│  │   │  │  ┌────────────┐  │    │  ┌────────┐ ┌────────┐ ┌────────┐       │   │  │ │
│  │   │  │  │    ALB     │──┼────┼─►│Web-FE  │ │API-GW  │ │Prediag │       │   │  │ │
│  │   │  │  │  (Public)  │  │    │  │ Task   │ │ Task   │ │ Task   │       │   │  │ │
│  │   │  │  └────────────┘  │    │  └────────┘ └────────┘ └────────┘       │   │  │ │
│  │   │  │                  │    │                                          │   │  │ │
│  │   │  │  ┌────────────┐  │    │  ┌────────────────────────────────────┐ │   │  │ │
│  │   │  │  │ NAT Gateway│  │    │  │   RDS PostgreSQL (Primary)        │ │   │  │ │
│  │   │  │  │     A      │  │    │  │   DocumentDB (Primary)            │ │   │  │ │
│  │   │  │  └────────────┘  │    │  │   Amazon MQ (Active)              │ │   │  │ │
│  │   │  │                  │    │  └────────────────────────────────────┘ │   │  │ │
│  │   │  └──────────────────┘    └──────────────────────────────────────────┘   │  │ │
│  │   └─────────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                                 │ │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│  │   │                        AVAILABILITY ZONE B                              │  │ │
│  │   │                                                                          │  │ │
│  │   │  ┌──────────────────┐    ┌──────────────────────────────────────────┐   │  │ │
│  │   │  │ Public Subnet B  │    │           Private Subnet B               │   │  │ │
│  │   │  │ (10.0.2.0/24)    │    │           (10.0.20.0/24)                 │   │  │ │
│  │   │  │                  │    │                                          │   │  │ │
│  │   │  │  ┌────────────┐  │    │  ┌────────┐ ┌────────┐ ┌────────┐       │   │  │ │
│  │   │  │  │    ALB     │──┼────┼─►│Web-FE  │ │API-GW  │ │Prediag │       │   │  │ │
│  │   │  │  │  (Node B)  │  │    │  │ Task   │ │ Task   │ │ Task   │       │   │  │ │
│  │   │  │  └────────────┘  │    │  └────────┘ └────────┘ └────────┘       │   │  │ │
│  │   │  │                  │    │                                          │   │  │ │
│  │   │  │  ┌────────────┐  │    │  ┌────────────────────────────────────┐ │   │  │ │
│  │   │  │  │ NAT Gateway│  │    │  │   RDS PostgreSQL (Standby)        │ │   │  │ │
│  │   │  │  │     B      │  │    │  │   DocumentDB (Replica)            │ │   │  │ │
│  │   │  │  └────────────┘  │    │  │   Amazon MQ (Standby)             │ │   │  │ │
│  │   │  │                  │    │  └────────────────────────────────────┘ │   │  │ │
│  │   │  └──────────────────┘    └──────────────────────────────────────────┘   │  │ │
│  │   └─────────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                                 │ │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐  │ │
│  │   │                         SHARED SERVICES                                 │  │ │
│  │   │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │  │ │
│  │   │  │    ECR     │ │   S3       │ │CloudWatch  │ │   AWS Cloud Map    │   │  │ │
│  │   │  │  Registry  │ │  Buckets   │ │   Logs     │ │  Service Discovery │   │  │ │
│  │   │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘   │  │ │
│  │   └─────────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌──────────────────┐                                                               │
│  │    Route 53      │  ◄── DNS público (opcional)                                  │
│  │   (DNS Zone)     │                                                               │
│  └──────────────────┘                                                               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Componentes AWS

| Componente Docker | Servicio AWS | Acceso | Justificación |
|-------------------|--------------|--------|---------------|
| reverse-proxy (Nginx) | **Application Load Balancer** | Público | Balanceo nativo, health checks, SSL/TLS |
| web-front-end | **ECS Fargate + ALB** | **Público** | UI servida directamente al usuario |
| api-gateway (×3) | **ECS Fargate + ALB** | **Público** | APIs expuestas al frontend y CLI |
| auth-be | **ECS Fargate** | Cloud Map | Descubrimiento interno por DNS |
| prediagnostic-be | **ECS Fargate** | Cloud Map | Descubrimiento interno por DNS |
| notification-be | **ECS Fargate** | Cloud Map | Worker consume de RabbitMQ |
| message-producer | **ECS Fargate** | Cloud Map | API interna para notificaciones |
| cli-front-end | ❌ No desplegado | Local | Cliente CLI ejecutado en PC del usuario |
| auth-db (PostgreSQL) | **RDS PostgreSQL Multi-AZ** | Privado | Failover automático (Escenario 4) |
| prediagnostic-db (MongoDB) | **Amazon DocumentDB** | Privado | Compatible MongoDB, replicación |
| message-broker (RabbitMQ) | **Amazon MQ for RabbitMQ** | Privado | Active/Standby Multi-AZ |

---

## 🔄 Patrones de Disponibilidad

### Escenario 1: Replication Pattern (Hot Spare) - API Gateway

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOT SPARE - API GATEWAY CLUSTER                          │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     ALB PÚBLICO (Internet-facing)                  │    │
│  │                                                                    │    │
│  │     Tráfico externo desde Internet → web-frontend únicamente       │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│                         ┌────────────────┐                                  │
│                         │  WEB FRONTEND  │                                  │
│                         │   (Next.js)    │                                  │
│                         │   Server Actns │                                  │
│                         └───────┬────────┘                                  │
│                                 │                                           │
│                                 │ Server Actions llaman                     │
│                                 │ al ALB INTERNO                            │
│                                 ▼                                           │
│    ┌────────────────────────────────────────────────────────────────────┐  │
│    │              ALB INTERNO (reverse-proxy style)                     │  │
│    │          Reemplaza tu nginx load balancer de Docker                │  │
│    │            (Health checks cada 30s, en subnets privadas)           │  │
│    └──────────────────────┬──────────────────────────────────┘          │  │
│                           │                                              │  │
│       ┌───────────────────┼───────────────────┐                         │  │
│       │                   │                   │                         │  │
│       ▼                   ▼                   ▼                         │  │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐                     │  │
│  │ API-GW  │        │ API-GW  │        │ API-GW  │                     │  │
│  │ Task 1  │        │ Task 2  │        │ Task 3  │                     │  │
│  │ (AZ-A)  │        │ (AZ-B)  │        │ (AZ-A)  │                     │  │
│  │ ACTIVE  │        │ ACTIVE  │        │ ACTIVE  │                     │  │
│  │ ✓       │        │ ✓       │        │ ✓       │                     │  │
│  └─────────┘        └─────────┘        └─────────┘                     │  │
│                                                                         │  │
│  ══════════════════════════════════════════════════════════════════════ │  │
│                                                                         │  │
│  ARQUITECTURA (similar a tu docker-compose con nginx):                  │  │
│  • ALB Interno = nginx reverse-proxy con upstream api_gateway          │  │
│  • 3 tareas ECS = api-gateway-1, api-gateway-2, api-gateway-3          │  │
│  • Distribución Active-Active entre todas las instancias                │  │
│                                                                         │  │
│  COMPORTAMIENTO:                                                        │  │
│  • Todas las instancias procesan tráfico simultáneamente               │  │
│  • ALB distribuye requests basado en health checks                     │  │
│  • Si una tarea falla → ALB la excluye automáticamente (~30s)          │  │
│  • ECS reemplaza tareas fallidas automáticamente                       │  │
│                                                                         │  │
│  RECURSOS TERRAFORM:                                                    │  │
│  • module.alb_internal (ALB en subnets privadas)                       │  │
│  • aws_ecs_service (desired_count = 3)                                 │  │
│  • aws_lb_target_group (health_check configurado)                      │  │
│  • aws_appautoscaling_target (min=2, max=6)                            │  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Implementación Terraform clave:**

```hcl
# ALB INTERNO - Escenario 1: Hot Spare para API Gateway
# Equivalente a tu nginx reverse-proxy de Docker
module "alb_internal" {
  source = "./modules/alb"

  name_prefix = local.name_prefix
  alb_name    = "internal"
  vpc_id      = module.network.vpc_id
  subnet_ids  = module.network.private_subnet_ids  # SUBNETS PRIVADAS
  internal    = true  # NO expuesto a Internet

  target_groups = {
    "api-gateway" = {
      port                 = 8080
      health_check_path    = "/"
      health_check_matcher = "200"
      priority             = 10
      path_patterns        = ["/*"]
    }
  }
}

# Servicio ECS del API Gateway conectado al ALB interno
resource "aws_ecs_service" "api_gateway" {
  name            = "api-gateway"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 3  # HOT SPARE: 3 instancias activas
  launch_type     = "FARGATE"

  # Distribución Multi-AZ automática
  network_configuration {
    subnets         = var.private_subnets
    security_groups = [aws_security_group.api_gateway.id]
  }

  # Conecta al ALB INTERNO (no público)
  load_balancer {
    target_group_arn = module.alb_internal.target_group_arns["api-gateway"]
    container_name   = "api-gateway"
    container_port   = 8080
  }

  # Despliegue sin downtime
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
}

# Health checks del ALB interno
resource "aws_lb_target_group" "api_gateway" {
  name        = "api-gateway-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }
}
```

---

### Escenario 2: Service Discovery Pattern - AWS Cloud Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVICE DISCOVERY - AWS CLOUD MAP                        │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────┐             │
│    │              AWS CLOUD MAP NAMESPACE                     │             │
│    │              neumo.internal (Private DNS)                │             │
│    └─────────────────────────────────────────────────────────┘             │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                        │
│         │                    │                    │                        │
│         ▼                    ▼                    ▼                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ auth-be.neumo   │  │ prediag.neumo   │  │ producer.neumo  │            │
│  │   .internal     │  │   .internal     │  │   .internal     │            │
│  │                 │  │                 │  │                 │            │
│  │  DNS: A Record  │  │  DNS: A Record  │  │  DNS: A Record  │            │
│  │  Health: ✓      │  │  Health: ✓      │  │  Health: ✓      │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  CÓMO FUNCIONA:                                                            │
│  1. ECS registra automáticamente cada tarea en Cloud Map                   │
│  2. Servicios se descubren por DNS: auth-be.neumo.internal                 │
│  3. Al escalar, nuevas IPs se agregan automáticamente al DNS               │
│  4. Al fallar una tarea, su IP se remueve del DNS                          │
│                                                                             │
│  EJEMPLO DE LLAMADA:                                                        │
│  API Gateway → http://auth-be.neumo.internal:8081/auth                     │
│                                                                             │
│  RECURSOS TERRAFORM:                                                        │
│  • aws_service_discovery_private_dns_namespace                             │
│  • aws_service_discovery_service                                           │
│  • aws_ecs_service.service_registries                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementación Terraform clave:**

```hcl
# Escenario 2: Service Discovery con Cloud Map
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "neumo.internal"
  description = "Service discovery namespace for NeumoDiagnostics"
  vpc         = var.vpc_id
}

resource "aws_service_discovery_service" "auth_be" {
  name = "auth-be"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10  # TTL bajo para failover rápido
      type = "A"
    }

    routing_policy = "MULTIVALUE"  # Balanceo DNS
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# Registro automático del servicio ECS
resource "aws_ecs_service" "auth_be" {
  name            = "auth-be"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.auth_be.arn
  
  # Registro en Cloud Map
  service_registries {
    registry_arn = aws_service_discovery_service.auth_be.arn
  }
  
  # ... resto de configuración
}
```

---

### Escenario 3: Cluster Pattern - Prediagnostic Backend

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLUSTER PATTERN - PREDIAGNOSTIC SERVICE                  │
│                                                                             │
│                    ┌───────────────────────────────┐                       │
│                    │   Internal Application LB     │                       │
│                    │   (prediag-internal-alb)      │                       │
│                    └───────────────┬───────────────┘                       │
│                                    │                                        │
│    ┌───────────────────────────────┴────────────────────────────┐          │
│    │                    ECS CLUSTER                              │          │
│    │                   (Fargate Capacity)                        │          │
│    │                                                             │          │
│    │   ┌─────────────────────────────────────────────────────┐  │          │
│    │   │              AVAILABILITY ZONE A                     │  │          │
│    │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │          │
│    │   │  │ Prediag    │  │ Prediag    │  │ Prediag    │     │  │          │
│    │   │  │ Task 1     │  │ Task 2     │  │ Task 3     │     │  │          │
│    │   │  │ vCPU: 1    │  │ vCPU: 1    │  │ vCPU: 1    │     │  │          │
│    │   │  │ Mem: 2GB   │  │ Mem: 2GB   │  │ Mem: 2GB   │     │  │          │
│    │   │  └────────────┘  └────────────┘  └────────────┘     │  │          │
│    │   └─────────────────────────────────────────────────────┘  │          │
│    │                                                             │          │
│    │   ┌─────────────────────────────────────────────────────┐  │          │
│    │   │              AVAILABILITY ZONE B                     │  │          │
│    │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │          │
│    │   │  │ Prediag    │  │ Prediag    │  │ Prediag    │     │  │          │
│    │   │  │ Task 4     │  │ Task 5     │  │ Task 6     │     │  │          │
│    │   │  │ vCPU: 1    │  │ vCPU: 1    │  │ vCPU: 1    │     │  │          │
│    │   │  │ Mem: 2GB   │  │ Mem: 2GB   │  │ Mem: 2GB   │     │  │          │
│    │   │  └────────────┘  └────────────┘  └────────────┘     │  │          │
│    │   └─────────────────────────────────────────────────────┘  │          │
│    └─────────────────────────────────────────────────────────────┘          │
│                                    │                                        │
│                                    ▼                                        │
│    ┌─────────────────────────────────────────────────────────────┐          │
│    │              AMAZON DOCUMENTDB CLUSTER                       │          │
│    │  ┌────────────────────┐    ┌────────────────────┐           │          │
│    │  │   Primary (AZ-A)   │    │   Replica (AZ-B)   │           │          │
│    │  │   Read/Write       │    │   Read Only        │           │          │
│    │  └────────────────────┘    └────────────────────┘           │          │
│    └─────────────────────────────────────────────────────────────┘          │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  CARACTERÍSTICAS DEL CLUSTER:                                               │
│  • N+1 Redundancia: 6 tareas (mínimo 4 necesarias)                         │
│  • Distribución equilibrada entre AZs                                       │
│  • Auto-scaling basado en CPU/Memory                                        │
│  • Modelo ML cargado en S3, descargado al iniciar                          │
│                                                                             │
│  RECURSOS TERRAFORM:                                                        │
│  • aws_ecs_cluster (capacity_providers = FARGATE)                          │
│  • aws_appautoscaling_target (min=4, max=10)                               │
│  • aws_appautoscaling_policy (target_tracking: CPU 70%)                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementación Terraform clave:**

```hcl
# Escenario 3: Cluster Pattern para Prediagnostic
resource "aws_ecs_cluster" "main" {
  name = "neumo-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  # Cluster con Fargate
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 2  # Mínimo 2 tareas en FARGATE regular
  }
}

resource "aws_ecs_service" "prediagnostic" {
  name            = "prediagnostic-be"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.prediagnostic.arn
  desired_count   = 6  # N+1 redundancia
  launch_type     = "FARGATE"
  
  # Forzar distribución Multi-AZ
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 50
  }

  # Estrategia de placement: distribuir entre AZs
  placement_strategy {
    type  = "spread"
    field = "attribute:ecs.availability-zone"
  }
}

# Auto-scaling para el cluster
resource "aws_appautoscaling_target" "prediagnostic" {
  max_capacity       = 10
  min_capacity       = 4
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.prediagnostic.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "prediagnostic_cpu" {
  name               = "prediagnostic-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.prediagnostic.resource_id
  scalable_dimension = aws_appautoscaling_target.prediagnostic.scalable_dimension
  service_namespace  = aws_appautoscaling_target.prediagnostic.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

---

### Escenario 4: Database Failover (Warm Spare) - RDS Multi-AZ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WARM SPARE - RDS POSTGRESQL MULTI-AZ                     │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────┐             │
│    │              AMAZON RDS ENDPOINT                         │             │
│    │        auth-db.xxxxx.us-east-1.rds.amazonaws.com        │             │
│    │           (DNS que apunta al PRIMARY)                   │             │
│    └──────────────────────────┬──────────────────────────────┘             │
│                               │                                             │
│         ┌─────────────────────┴─────────────────────┐                      │
│         │                                           │                      │
│         ▼                                           ▼                      │
│  ┌─────────────────────┐                ┌─────────────────────┐            │
│  │   AVAILABILITY      │                │   AVAILABILITY      │            │
│  │     ZONE A          │                │     ZONE B          │            │
│  │                     │                │                     │            │
│  │  ┌───────────────┐  │   Replicación  │  ┌───────────────┐  │            │
│  │  │               │  │   Síncrona     │  │               │  │            │
│  │  │   PRIMARY     │──┼───────────────►│──│   STANDBY     │  │            │
│  │  │   (Active)    │  │                │  │   (Passive)   │  │            │
│  │  │               │  │                │  │               │  │            │
│  │  │   Read/Write  │  │                │  │   Warm Spare  │  │            │
│  │  │      ✓        │  │                │  │   (No Traffic)│  │            │
│  │  └───────────────┘  │                │  └───────────────┘  │            │
│  │                     │                │                     │            │
│  └─────────────────────┘                └─────────────────────┘            │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  PROCESO DE FAILOVER (60-120 segundos):                                    │
│  1. AWS detecta fallo en Primary (health checks)                           │
│  2. Standby se promociona a Primary                                        │
│  3. DNS Endpoint se actualiza automáticamente                              │
│  4. Aplicaciones reconectan sin cambios de código                          │
│                                                                             │
│  RECURSOS TERRAFORM:                                                        │
│  • aws_db_instance (multi_az = true)                                       │
│  • aws_db_subnet_group (subnets en múltiples AZs)                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementación Terraform clave:**

```hcl
# Escenario 4: Warm Spare - RDS Multi-AZ
resource "aws_db_instance" "auth_db" {
  identifier     = "auth-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "auth_db"
  username = var.db_username
  password = var.db_password

  # WARM SPARE: Instancia en standby en otra AZ
  multi_az = true

  # Subnet group con múltiples AZs
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Backup y mantenimiento
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Performance y monitoreo
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  # Tags
  tags = {
    Pattern = "WarmSpare"
    Scenario = "4-DatabaseFailover"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "neumo-db-subnet-group"
  subnet_ids = var.private_subnets

  tags = {
    Name = "NeumoDiagnostics DB Subnet Group"
  }
}
```

---

## 📊 Mapeo Docker → AWS

### Configuración de Tareas ECS

| Servicio | vCPU | Memory | Puerto | Health Check | Logs |
|----------|------|--------|--------|--------------|------|
| api-gateway | 0.5 | 1024 MB | 8080 | `/health` | CloudWatch |
| auth-be | 0.25 | 512 MB | 8081 | `/health` | CloudWatch |
| prediagnostic-be | 1.0 | 2048 MB | 8000 | `/api/v1/health` | CloudWatch |
| notification-be | 0.25 | 512 MB | - | Custom | CloudWatch |
| message-producer | 0.25 | 512 MB | 8082 | `/health` | CloudWatch |
| web-front-end | 0.5 | 1024 MB | 3000 | `/` | CloudWatch |

### Variables de Entorno por Servicio

```hcl
# API Gateway
environment = [
  { name = "AUTH_SERVICE_URL",        value = "http://auth-be.neumo.internal:8081" },
  { name = "PREDIAGNOSTIC_SERVICE_URL", value = "http://prediagnostic-be.neumo.internal:8000" },
  { name = "NOTIFICATION_SERVICE_URL",  value = "http://message-producer.neumo.internal:8082" },
]

# Auth BE
environment = [
  { name = "DATABASE_URL", value = "postgres://user:pass@auth-db.xxxxx.rds.amazonaws.com:5432/auth_db" },
]

# Prediagnostic BE
environment = [
  { name = "MONGODB_URL",  value = "mongodb://prediag-docdb.xxxxx.docdb.amazonaws.com:27017" },
  { name = "MODEL_PATH",   value = "s3://neumo-models/finalModel.keras" },
  { name = "API_PORT",     value = "8000" },
]

# Notification BE
environment = [
  { name = "RABBITMQ_URL",  value = "amqps://user:pass@mq.xxxxx.mq.us-east-1.amazonaws.com:5671" },
  { name = "SMTP_HOST",     value = "smtp.mailgun.org" },
]
```

---

## ⚖️ Trade-offs y Decisiones

### ECS Fargate vs EKS

| Aspecto | ECS Fargate ✅ | EKS |
|---------|---------------|-----|
| **Complejidad** | Menor | Mayor (cluster, nodes) |
| **Costo para proyecto pequeño** | Menor | Mayor (control plane $72/mes) |
| **Curva de aprendizaje** | Más suave | Requiere conocer K8s |
| **Integración AWS** | Nativa | Requiere add-ons |
| **Portabilidad** | Menor | Mayor (estándar K8s) |

**Decisión**: ECS Fargate por ser un proyecto educativo donde la simplicidad y el costo son prioritarios.

### DocumentDB vs MongoDB Atlas

| Aspecto | DocumentDB ✅ | MongoDB Atlas |
|---------|--------------|---------------|
| **Integración VPC** | Nativa | VPC Peering |
| **Costo** | Pay per use | Cluster mínimo |
| **Compatibilidad** | MongoDB 4.0 API | MongoDB completo |
| **Gestión** | AWS | MongoDB |

**Decisión**: DocumentDB por mejor integración con VPC y gestión unificada en AWS.

### ALB vs Nginx (Reverse Proxy)

| Aspecto | ALB ✅ | Nginx en ECS |
|---------|-------|--------------|
| **Alta disponibilidad** | Built-in | Requiere configuración |
| **SSL/TLS** | ACM integrado | Gestión manual |
| **Health checks** | Nativos | Configuración manual |
| **Costo** | ~$16/mes + LCU | Costo de task |

**Decisión**: ALB reemplaza el reverse-proxy Nginx, proporcionando HA nativa y SSL con ACM.

---

## 🧪 Pruebas y Validación

### Escenario 1: Hot Spare (API Gateway)

```bash
# 1. Simular fallo de una tarea
aws ecs stop-task --cluster neumo-cluster \
  --task <task-arn> --reason "Testing Hot Spare failover"

# 2. Verificar que ALB excluye la tarea
aws elbv2 describe-target-health --target-group-arn <tg-arn>

# 3. Verificar que ECS levanta nueva tarea
aws ecs list-tasks --cluster neumo-cluster --service-name api-gateway

# 4. Verificar respuestas sin interrupción
while true; do curl -w "%{http_code}\n" http://alb-url/health; sleep 1; done
```

### Escenario 2: Service Discovery

```bash
# 1. Verificar registro en Cloud Map
aws servicediscovery list-instances --service-id <service-id>

# 2. Resolver DNS desde dentro del VPC
dig auth-be.neumo.internal

# 3. Escalar servicio y verificar nuevos registros
aws ecs update-service --cluster neumo-cluster --service auth-be --desired-count 3
aws servicediscovery list-instances --service-id <service-id>
```

### Escenario 3: Cluster Pattern

```bash
# 1. Verificar distribución entre AZs
aws ecs list-tasks --cluster neumo-cluster --service-name prediagnostic-be

# 2. Simular fallo de AZ (en test, no hacer en producción real)
# Terminar todas las tareas en una AZ y verificar que el servicio sigue respondiendo

# 3. Verificar auto-scaling
# Generar carga y observar métricas de CloudWatch
```

### Escenario 4: Database Failover

```bash
# 1. Verificar configuración Multi-AZ
aws rds describe-db-instances --db-instance-identifier auth-db \
  --query 'DBInstances[0].MultiAZ'

# 2. Simular failover (causa ~60-120s de downtime)
aws rds reboot-db-instance --db-instance-identifier auth-db --force-failover

# 3. Monitorear evento de failover
aws rds describe-events --source-identifier auth-db --source-type db-instance
```

---

## 📁 Estructura de Terraform

```
infra/
├── ARCHITECTURE.md          # Este documento
├── main.tf                  # Configuración principal
├── providers.tf             # Providers y backend
├── variables.tf             # Variables globales
├── outputs.tf               # Outputs principales
├── locals.tf                # Valores locales computados
│
├── modules/
│   ├── network/             # VPC, subnets, NAT, routing
│   ├── ecs-cluster/         # ECS cluster y capacity providers
│   ├── ecs-service/         # Servicio ECS genérico (reutilizable)
│   ├── alb/                 # Application Load Balancer
│   ├── rds/                 # RDS PostgreSQL Multi-AZ
│   ├── documentdb/          # DocumentDB cluster
│   ├── mq/                  # Amazon MQ for RabbitMQ
│   ├── ecr/                 # ECR repositories
│   ├── service-discovery/   # Cloud Map namespace y services
│   └── s3/                  # S3 buckets (modelos, radiografías)
│
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── terraform.tfvars
    │   └── backend.tf
    └── prod/
        ├── main.tf
        ├── terraform.tfvars
        └── backend.tf
```

---

## 🚀 CI/CD Recomendado

```yaml
# .github/workflows/deploy.yml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths:
      - 'infra/**'
      - '.github/workflows/deploy.yml'

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init
        working-directory: infra/environments/dev

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: infra/environments/dev

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve tfplan
        working-directory: infra/environments/dev

  build-and-push:
    needs: terraform
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-gateway, auth-be, prediagnostic-be, notification-be, message-producer, web-front-end]
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/${{ matrix.service }}:$IMAGE_TAG ./${{ matrix.service }}
          docker push $ECR_REGISTRY/${{ matrix.service }}:$IMAGE_TAG
          docker tag $ECR_REGISTRY/${{ matrix.service }}:$IMAGE_TAG $ECR_REGISTRY/${{ matrix.service }}:latest
          docker push $ECR_REGISTRY/${{ matrix.service }}:latest
```

---

## 💰 Estimación de Costos (us-east-1)

| Servicio | Configuración | Costo Mensual Estimado |
|----------|---------------|------------------------|
| ECS Fargate | 6 tareas promedio | ~$120 |
| RDS PostgreSQL | db.t3.medium Multi-AZ | ~$75 |
| DocumentDB | db.t3.medium (2 instancias) | ~$140 |
| Amazon MQ | mq.t3.micro | ~$25 |
| ALB | 2 ALBs | ~$35 |
| NAT Gateway | 2 (Multi-AZ) | ~$90 |
| ECR | ~10 GB | ~$1 |
| S3 | ~50 GB | ~$2 |
| CloudWatch | Logs + Métricas | ~$15 |
| **TOTAL** | | **~$500/mes** |

> **Nota**: Para desarrollo, se puede reducir a ~$150/mes usando instancias más pequeñas, un solo NAT Gateway, y DocumentDB serverless.

