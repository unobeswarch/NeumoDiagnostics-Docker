# 📝 Cambios Recomendados en el Código para AWS

Este documento lista los cambios necesarios en el código de la aplicación antes de desplegar en AWS.

---

## 🔴 CRÍTICO: URLs Hardcodeadas en Frontend

El código del frontend tiene URLs hardcodeadas a `http://reverse-proxy/...` que **NO funcionarán en AWS**.

### Problema Actual

```typescript
// ❌ HARDCODEADO - No funciona en AWS
const GRAPHQL_URL = 'http://reverse-proxy/graphql';
await fetch("http://reverse-proxy/auth", {...})
```

### Archivos Afectados

| Archivo | Líneas con problema |
|---------|---------------------|
| `web-front-end/lib/apollo-client.ts` | Línea 4 |
| `web-front-end/lib/cases-service.ts` | Línea 18 |
| `web-front-end/server-actions/auth-actions.tsx` | Líneas 18, 60, 132, 149 |
| `web-front-end/server-actions/cases-actions.tsx` | Líneas 98, 172, 202 |
| `web-front-end/components/prediagnostic-detail.tsx` | Línea 109 |
| `web-front-end/app/patient/radiograph/[id]/page.tsx` | Línea 55 |

### Solución Requerida

**Paso 1**: Crear archivo de configuración `web-front-end/lib/config.ts`:

```typescript
// Configuración de URLs para diferentes entornos
export const API_CONFIG = {
  // Para Server Actions (ejecutan en el servidor de Next.js)
  // En Docker: http://reverse-proxy
  // En AWS: http://api-gateway.neumo.internal:8080 (via Cloud Map)
  SERVER_API_URL: process.env.SERVER_API_URL || 'http://reverse-proxy',
  
  // Para Client Components (ejecutan en el navegador)
  // En Docker: http://localhost (via reverse-proxy puerto 80)
  // En AWS: https://alb.amazonaws.com o tu dominio
  CLIENT_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://reverse-proxy',
};
```

**Paso 2**: Actualizar `apollo-client.ts`:

```typescript
import { API_CONFIG } from './config';

const GRAPHQL_URL = `${API_CONFIG.SERVER_API_URL}/graphql`;
```

**Paso 3**: Actualizar Server Actions (`auth-actions.tsx`, `cases-actions.tsx`):

```typescript
import { API_CONFIG } from '../lib/config';

// Antes:
await fetch("http://reverse-proxy/auth", {...})

// Después:
await fetch(`${API_CONFIG.SERVER_API_URL}/auth`, {...})
```

**Paso 4**: Actualizar Client Components (para URLs de imágenes, etc.):

```typescript
import { API_CONFIG } from '../lib/config';

// Antes:
const imageUrl = `http://reverse-proxy/prediagnostic/image/${filename}`

// Después:
const imageUrl = `${API_CONFIG.CLIENT_API_URL}/prediagnostic/image/${filename}`
```

### Variables de Entorno en AWS (Terraform)

El Terraform ya pasa estas variables, pero el código no las usa:

```hcl
# En infra/main.tf - módulo web-frontend
environment_variables = [
  {
    name  = "NEXT_PUBLIC_API_URL"        # Para cliente (navegador)
    value = "http://${module.alb_public.alb_dns_name}"
  },
  {
    name  = "SERVER_API_URL"             # Para servidor (Next.js)
    value = "http://api-gateway.neumo.internal:8080"
  }
]
```

---

## ⚠️ Cambios Obligatorios

### 1. API Gateway - Agregar endpoint `/health`

**Archivo**: `api-gateway/cmd/server/main.go`

**Cambio requerido**: Agregar un endpoint de health check antes de la línea 93.

```go
// Agregar antes de log.Printf
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"healthy"}`))
})
```

**Razón**: El ALB necesita un endpoint que devuelva 200 OK para verificar que el servicio está funcionando. Actualmente se usa `/` (GraphQL Playground) como workaround.

---

### 2. Auth-BE - Agregar endpoint `/health`

**Archivo**: `auth-be/cmd/server/main.go`

**Cambio requerido**: Agregar un endpoint de health check.

```go
// Agregar antes de log.Fatal
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"healthy"}`))
})
```

**Razón**: Service Discovery puede usar health checks para marcar instancias como unhealthy.

---

### 3. API Gateway - Usar variables de entorno para todos los servicios

**Archivo**: `api-gateway/cmd/server/main.go`

**Cambio actual** (línea 40):
```go
diagnosticService := services.NewDiagnosticService(prediagnosticURL, "http://message-producer:8082", authURL)
```

**Cambio requerido**:
```go
notificationURL := os.Getenv("NOTIFICATION_SERVICE_URL")
if notificationURL == "" {
    notificationURL = "http://message-producer:8082"
}
diagnosticService := services.NewDiagnosticService(prediagnosticURL, notificationURL, authURL)
```

**Razón**: En AWS, el Service Discovery usa el dominio `message-producer.neumo.internal`, no el nombre Docker.

---

## 🔧 Cambios Opcionales (Recomendados)

### 4. Dockerfiles - Usar versión estable de Go

Los Dockerfiles usan `golang:1.25.1` que no existe. La última versión estable es 1.21.x o 1.22.x.

**Archivos afectados**:
- `api-gateway/Dockerfile`
- `auth-be/Dockerfile`
- `message-producer/Dockerfile`

**Cambio**:
```dockerfile
FROM golang:1.21-alpine
```

---

### 5. Prediagnostic-BE - Ajustar carga del modelo desde S3

**Archivo**: `prediagnostic-be/src/config/settings.py`

El modelo debería poder cargarse desde S3 en lugar de solo desde el filesystem local.

```python
import boto3
import os

def download_model_from_s3():
    """Descarga el modelo desde S3 si no existe localmente."""
    model_path = os.getenv("MODEL_PATH", "/app/models/finalModel.keras")
    
    if model_path.startswith("s3://"):
        # Parsear bucket y key
        s3_path = model_path.replace("s3://", "")
        bucket, key = s3_path.split("/", 1)
        local_path = "/tmp/model.keras"
        
        s3 = boto3.client('s3')
        s3.download_file(bucket, key, local_path)
        return local_path
    
    return model_path
```

---

## 📊 Mapeo de Variables de Entorno

| Variable en Terraform | Uso en el Código | Estado |
|----------------------|------------------|--------|
| `AUTH_SERVICE_URL` | `os.Getenv("AUTH_SERVICE_URL")` | ✅ Usado |
| `PREDIAGNOSTIC_SERVICE_URL` | `os.Getenv("PREDIAGNOSTIC_SERVICE_URL")` | ✅ Usado |
| `NOTIFICATION_SERVICE_URL` | Hardcodeado | ⚠️ Necesita cambio |
| `DATABASE_URL` | Depende de implementación auth-be | ⚠️ Verificar |
| `MONGODB_URL` | `os.getenv("MONGODB_URL")` | ✅ Usado |
| `RABBITMQ_URL` | `os.Getenv("RABBITMQ_URL")` | ✅ Usado |

---

## 🔒 Secretos

Los siguientes valores sensibles se pasan como variables de entorno pero deberían usar AWS Secrets Manager en producción:

1. `DATABASE_URL` (contiene password)
2. `MONGODB_URL` (contiene password)
3. `RABBITMQ_URL` (contiene password)
4. `SMTP_PASSWORD`

Para usar Secrets Manager, cambiar las task definitions para usar:

```hcl
secrets = [
  {
    name      = "DATABASE_URL"
    valueFrom = "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:neumo/db-url"
  }
]
```

---

## ✅ Verificación Pre-Despliegue

- [ ] Health endpoints agregados a api-gateway y auth-be
- [ ] Variables de entorno configuradas correctamente
- [ ] Dockerfiles usando versión válida de Go
- [ ] Modelo ML accesible desde S3 o incluido en imagen
- [ ] Secretos configurados en AWS Secrets Manager (producción)

