# NeumoDiagnostics - Sistema de Diagnóstico Neumológico# NeumoDiagnostics-Docker

**Versión:** 2.0  
**Última Actualización:** 11 de Noviembre de 2025  
**Estado:** ✅ Producción (Desarrollo Local)

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Inicio Rápido](#inicio-rápido)
4. [Servicios y Componentes](#servicios-y-componentes)
5. [Load Balancer](#load-balancer)
6. [HTTPS y Seguridad](#https-y-seguridad)
7. [Redes Docker](#redes-docker)
8. [Comandos Útiles](#comandos-útiles)
9. [Pruebas](#pruebas)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General

NeumoDiagnostics es un sistema completo de diagnóstico neumológico basado en microservicios con Docker. Incluye:

- ✅ **3 instancias del API Gateway** con load balancing
- ✅ **HTTPS** en web frontend con certificados auto-firmados
- ✅ **Reverse Proxy** (Nginx) con balanceo de carga
- ✅ **Frontend Web** (Next.js 14) y **CLI** (Rust)
- ✅ **Backends** en Go y Python (FastAPI)
- ✅ **Bases de datos** PostgreSQL y MongoDB
- ✅ **Mensajería asíncrona** con RabbitMQ
- ✅ **Aislamiento de red** completo

---

## 🏗️ Arquitectura del Sistema

### Diagrama Global

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIOS                              │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             │ HTTPS (3443)                 │ Interactivo
             │ HTTP (3000)                  │
             │                              │
┌────────────▼──────────┐      ┌────────────▼──────────┐
│  Web Frontend         │      │  CLI Frontend         │
│  (Next.js + HTTPS)    │      │  (Rust)               │
│  172.30.0.3           │      │  172.30.0.4           │
└────────────┬──────────┘      └────────────┬──────────┘
             │                              │
             └──────────────┬───────────────┘
                            │ HTTP (interno)
             ┌──────────────▼──────────────┐
             │  Reverse Proxy (Nginx)      │
             │  Load Balancer              │
             │  172.30.0.2 / 192.168.10.x  │
             └──────────────┬──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼─────────┐
│ API Gateway 1  │  │ API Gateway 2  │  │ API Gateway 3  │
│ 192.168.10.12  │  │ 192.168.10.11  │  │ 192.168.10.4   │
└───────┬────────┘  └───────┬────────┘  └──────┬─────────┘
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼─────────┐
│  Auth Backend  │  │ Prediagnostic  │  │ Message Queue  │
│  (Go)          │  │ Backend (Py)   │  │ (RabbitMQ)     │
└───────┬────────┘  └───────┬────────┘  └──────┬─────────┘
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼─────────┐
│  Auth DB       │  │ Prediagnostic  │  │ Notification   │
│  (PostgreSQL)  │  │ DB (MongoDB)   │  │ Backend (Py)   │
└────────────────┘  └────────────────┘  └────────────────┘
```

### Flujo de Peticiones

```
1. Usuario → https://localhost:3443 (HTTPS)
2. Web Frontend → http://reverse-proxy (HTTP interno)
3. Reverse Proxy → Load Balancer → api-gateway-{1,2,3}:8080
4. API Gateway → Backends (auth-be, prediagnostic-be)
5. Backends → Bases de Datos (PostgreSQL, MongoDB)
6. Respuesta ← Bases de Datos ← Backends ← API Gateway ← Reverse Proxy ← Frontend ← Usuario
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker Desktop instalado
- Docker Compose
- Puertos disponibles: 3000, 3443, 80, 5432, 27017, 5672, 15672

### Iniciar Todos los Servicios

```bash
# Clonar repositorio
cd NeumoDiagnostics-Docker

# Generar certificados SSL (primera vez)
cd web-front-end
./scripts/generate-certs.sh
cd ..

# Iniciar servicios
docker-compose up -d

# Verificar estado
docker-compose ps
```

### Acceder a la Aplicación

**Web Frontend (Recomendado):**
```
https://localhost:3443
```

**CLI Frontend:**
```bash
./test-cli.sh
# O manualmente:
docker exec -it cli-front-end bash -c "cd /app && ./target/release/neumodiag-cli"
```

**Aceptar Certificado Auto-firmado:**
- Chrome/Edge: "Avanzado" → "Continuar a localhost"
- Firefox: "Avanzado" → "Aceptar el riesgo"
- Safari: "Mostrar detalles" → "Visitar sitio"

---

## 🔧 Servicios y Componentes

### Frontend

| Servicio | Tecnología | Puerto | Red | Descripción |
|----------|------------|--------|-----|-------------|
| **web-front-end** | Next.js 14.2.33 | 3443 (HTTPS), 3000 (HTTP) | public | Interfaz web con HTTPS |
| **cli-front-end** | Rust 1.83.0 | - | public | CLI interactivo |

### Gateway y Proxy

| Servicio | Tecnología | Puerto | Red | Descripción |
|----------|------------|--------|-----|-------------|
| **reverse-proxy** | Nginx Alpine | 80 | public + private | Load balancer y router |
| **api-gateway-1** | Go 1.25.1 | 8080 (interno) | private | API Gateway instancia 1 |
| **api-gateway-2** | Go 1.25.1 | 8080 (interno) | private | API Gateway instancia 2 |
| **api-gateway-3** | Go 1.25.1 | 8080 (interno) | private | API Gateway instancia 3 |

### Backend Services

| Servicio | Tecnología | Puerto | Red | Descripción |
|----------|------------|--------|-----|-------------|
| **auth-be** | Go 1.25.1 | 8081 | private | Autenticación y usuarios |
| **prediagnostic-be** | Python 3.11 (FastAPI) | 8000 | private | Diagnóstico con IA |
| **notification-be** | Python 3.11 | - | private | Worker de notificaciones |
| **message-producer** | Go 1.25.1 | 8082 | private | Productor de mensajes |

### Bases de Datos y Mensajería

| Servicio | Tecnología | Puerto | Red | Descripción |
|----------|------------|--------|-----|-------------|
| **auth-db** | PostgreSQL 15 | 5432 | private | BD de autenticación |
| **prediagnostic-db** | MongoDB | 27017 | private | BD de diagnósticos |
| **message-broker** | RabbitMQ 3 | 5672, 15672 | private | Cola de mensajes |

---

## ⚖️ Load Balancer

### Configuración

El **reverse-proxy** actúa como load balancer para las 3 instancias del API Gateway:

**Algoritmo:** `weighted round robin` (distribución basada en pesos)

```nginx
upstream api_gateway {
    # Pesos: api-gateway-1 (50%), api-gateway-2 (33%), api-gateway-3 (17%)
    server api-gateway-1:8080 weight=3 max_fails=3 fail_timeout=30s;
    server api-gateway-2:8080 weight=2 max_fails=3 fail_timeout=30s;
    server api-gateway-3:8080 weight=1 max_fails=3 fail_timeout=30s;
    
    keepalive 32;
}
```

**Características:**
- ✅ Distribución proporcional por pesos (3:2:1)
- ✅ api-gateway-1 recibe ~50% de las peticiones (weight=3)
- ✅ api-gateway-2 recibe ~33% de las peticiones (weight=2)
- ✅ api-gateway-3 recibe ~17% de las peticiones (weight=1)
- ✅ Health checks (3 fallos máximo, 30s timeout)
- ✅ Failover automático si una instancia falla
- ℹ️ Keepalive deshabilitado para distribución precisa de pesos

### Probar Load Balancer

```bash
# Ejecutar script de prueba
./test-loadbalancer.sh

# O manualmente hacer múltiples peticiones
for i in {1..10}; do
    curl -X POST http://localhost/auth \
        -H "Content-Type: application/json" \
        -d '{"correo":"test@test.com","contrasena":"test"}'
    echo "Request $i completed"
done
```

### Verificar Distribución

```bash
# Ver instancias activas
docker ps | grep api-gateway

# Ver IPs de las instancias
docker network inspect neumodiagnostics-docker_private | grep -A 3 api-gateway
```

---

## 🔐 HTTPS y Seguridad

### Certificados SSL

**Ubicación:** `web-front-end/certs/`

**Archivos:**
- `rootCA.pem` - Certificado raíz (instalar en el sistema)
- `rootCA.key` - Clave privada raíz
- `localhost.crt` - Certificado del servidor
- `localhost.key` - Clave privada del servidor

### Generar Certificados

```bash
cd web-front-end
./scripts/generate-certs.sh
```

### Confiar el Certificado (Opcional)

**macOS:**
```bash
cd web-front-end/certs/
open rootCA.pem
# En Keychain Access:
# 1. Arrastra a "System"
# 2. Doble click en el certificado
# 3. Trust → "Always Trust"
# 4. Reinicia el navegador
```

**Linux:**
```bash
sudo cp web-front-end/certs/rootCA.pem /usr/local/share/ca-certificates/neumo-root-ca.crt
sudo update-ca-certificates
# Reinicia el navegador
```

**Windows:**
```cmd
# Win + R → certmgr.msc
# Trusted Root Certification Authorities → Certificates
# Import → web-front-end\certs\rootCA.pem
# Reinicia el navegador
```

### Arquitectura de Seguridad

```
Capa 1: HTTPS/SSL (Web Frontend)
  ↓ Certificados TLS 1.2/1.3
  
Capa 2: Reverse Proxy (HTTP interno)
  ↓ Load balancing + routing
  
Capa 3: API Gateway (3 instancias)
  ↓ GraphQL + REST
  
Capa 4: Backends (servicios privados)
  ↓ Solo red privada
  
Capa 5: Bases de Datos (aisladas)
  ↓ Sin acceso externo
```

---

## 🌐 Redes Docker

### Red Pública (172.30.0.0/24)

**Propósito:** Acceso externo y comunicación con reverse proxy

**Servicios:**
- web-front-end (172.30.0.3)
- cli-front-end (172.30.0.4)
- reverse-proxy (172.30.0.2)

**Características:**
- Puertos expuestos al host
- Acceso desde localhost
- Gateway entre redes

### Red Privada (192.168.10.0/26)

**Propósito:** Servicios internos completamente aislados

**Servicios:**
- api-gateway-1 (192.168.10.12)
- api-gateway-2 (192.168.10.11)
- api-gateway-3 (192.168.10.4)
- reverse-proxy (192.168.10.x)
- auth-be (192.168.10.7)
- auth-db (192.168.10.2)
- prediagnostic-be (192.168.10.8)
- prediagnostic-db (192.168.10.6)
- message-broker (192.168.10.5)
- message-producer (192.168.10.10)
- notification-be (192.168.10.9)

**Características:**
- `internal: true` (sin acceso externo)
- Rango: 192.168.10.1 - 192.168.10.62
- 62 hosts disponibles
- Sin puertos expuestos al exterior

---

## 💻 Comandos Útiles

### Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up -d

# Iniciar y reconstruir
docker-compose up -d --build

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f web-front-end

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reiniciar un servicio
docker-compose restart reverse-proxy

# Ver estado de servicios
docker-compose ps
```

### Servicios Específicos

```bash
# Ver logs del load balancer
docker logs reverse-proxy -f

# Ver logs de una instancia del API Gateway
docker logs api-gateway-1 -f

# Ejecutar CLI interactivo
./test-cli.sh

# Probar load balancer
./test-loadbalancer.sh

# Reconstruir solo el reverse-proxy
docker-compose up -d --build reverse-proxy
```

### Redes y Debugging

```bash
# Ver contenedores activos
docker ps

# Ver todas las redes
docker network ls

# Inspeccionar red privada
docker network inspect neumodiagnostics-docker_private

# Inspeccionar red pública
docker network inspect neumodiagnostics-docker_public

# Ver IP de un contenedor
docker inspect api-gateway-1 | grep IPAddress

# Entrar a un contenedor
docker exec -it reverse-proxy sh
docker exec -it api-gateway-1 sh
```

### Testing

```bash
# Probar HTTPS del frontend
curl -k -I https://localhost:3443

# Probar reverse proxy
curl http://localhost/health

# Hacer petición de login
curl -X POST http://localhost/auth \
  -H "Content-Type: application/json" \
  -d '{"correo":"user@example.com","contrasena":"password"}'

# Probar GraphQL
curl -X POST http://localhost/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

---

## 🧪 Pruebas

### Script de Prueba del CLI

```bash
./test-cli.sh
```

**Qué hace:**
- Verifica que el CLI esté compilado
- Comprueba conectividad con reverse-proxy
- Ejecuta el CLI de forma interactiva
- Muestra logs del reverse-proxy al finalizar

### Script de Prueba del Load Balancer

```bash
./test-loadbalancer.sh
```

**Qué hace:**
- Verifica las 3 instancias del API Gateway
- Muestra IPs de cada instancia
- Realiza 15 peticiones al endpoint /auth
- Muestra distribución de peticiones por instancia
- Calcula porcentaje de distribución

### Pruebas Manuales

**Verificar HTTPS:**
```bash
openssl s_client -connect localhost:3443 -showcerts
```

**Verificar Load Balancer:**
```bash
# Hacer múltiples peticiones y observar logs
for i in {1..20}; do
    curl -s -X POST http://localhost/auth \
        -H "Content-Type: application/json" \
        -d '{"correo":"test","contrasena":"test"}' > /dev/null
    echo "Request $i"
done

# Ver logs en tiempo real
docker logs reverse-proxy -f
```

**Verificar Health de RabbitMQ:**
```bash
curl http://localhost:15672/api/health/checks/alarms
# User/Pass: guest/guest
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. "Cannot connect to HTTPS"

**Síntoma:** No puedes acceder a https://localhost:3443

**Solución:**
```bash
# Verificar que el contenedor esté corriendo
docker ps | grep web-front-end

# Ver logs
docker logs web-front-end

# Reiniciar
docker-compose restart web-front-end
```

#### 2. "API Gateway no responde"

**Síntoma:** Errores 502 Bad Gateway

**Solución:**
```bash
# Verificar que las 3 instancias estén activas
docker ps | grep api-gateway

# Ver logs de cada instancia
docker logs api-gateway-1
docker logs api-gateway-2
docker logs api-gateway-3

# Reiniciar instancias
docker-compose restart api-gateway-1 api-gateway-2 api-gateway-3
```

#### 3. "Load Balancer no distribuye correctamente"

**Síntoma:** Todas las peticiones van a la misma instancia

**Solución:**
```bash
# Verificar configuración de nginx
docker exec reverse-proxy cat /etc/nginx/nginx.conf | grep -A 10 upstream

# Reiniciar reverse-proxy
docker-compose restart reverse-proxy

# Verificar logs
docker logs reverse-proxy
```

#### 4. "Certificado SSL inválido"

**Síntoma:** Advertencia persistente en el navegador

**Solución:**
```bash
# Regenerar certificados
cd web-front-end
./scripts/generate-certs.sh

# Reconstruir frontend
cd ..
docker-compose up -d --build web-front-end

# Confiar el certificado raíz en el sistema (ver sección HTTPS)
```

#### 5. "Puerto en uso"

**Síntoma:** Error al iniciar: "port is already allocated"

**Solución:**
```bash
# Ver qué está usando el puerto
lsof -i :3443  # macOS/Linux
netstat -ano | findstr :3443  # Windows

# Detener servicios
docker-compose down

# Reiniciar
docker-compose up -d
```

#### 6. "Base de datos no conecta"

**Síntoma:** Errores de conexión a PostgreSQL o MongoDB

**Solución:**
```bash
# Verificar que las BD estén corriendo
docker ps | grep -E "auth-db|prediagnostic-db"

# Ver logs
docker logs auth-db
docker logs prediagnostic-db

# Verificar red privada
docker network inspect neumodiagnostics-docker_private
```

### Comandos de Diagnóstico

```bash
# Ver uso de recursos
docker stats

# Limpiar sistema
docker system prune -a

# Ver espacio en disco
docker system df

# Reiniciar todo desde cero
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

## 📊 Variables de Entorno

### Web Frontend

```bash
NODE_ENV=development
USE_HTTPS=true
HTTPS_PORT=3443
HTTP_PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_API_URL=http://reverse-proxy
```

### CLI Frontend

```bash
API_GATEWAY_URL=http://reverse-proxy
```

### API Gateway

```bash
AUTH_SERVICE_URL=http://auth-be:8081
PREDIAGNOSTIC_SERVICE_URL=http://prediagnostic-be:8000
```

---

## 📚 Documentación Adicional

### Archivos de Configuración

- `docker-compose.yml` - Orquestación de servicios
- `reverse-proxy/nginx.conf` - Configuración del load balancer
- `web-front-end/server.js` - Servidor HTTPS de Next.js
- `web-front-end/scripts/generate-certs.sh` - Generación de certificados

### Scripts Útiles

- `test-cli.sh` - Prueba del CLI frontend
- `test-loadbalancer.sh` - Prueba del load balancer
- `web-front-end/scripts/generate-certs.sh` - Genera certificados SSL

---

## 🎯 Características Principales

✅ **Alta Disponibilidad**
- 3 instancias del API Gateway con load balancing
- Failover automático
- Health checks configurados

✅ **Seguridad**
- HTTPS en el frontend
- Aislamiento de red (public/private)
- Servicios backend no expuestos
- Certificados SSL/TLS

✅ **Escalabilidad**
- Arquitectura de microservicios
- Load balancer configurado
- Comunicación asíncrona con RabbitMQ
- Fácil de escalar horizontalmente

✅ **Monitoreo**
- Logs centralizados
- Health check endpoints
- RabbitMQ management UI
- Métricas de nginx

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la sección de [Troubleshooting](#troubleshooting)
2. Verifica los logs con `docker-compose logs -f`
3. Consulta la configuración en `docker-compose.yml`

---

**Desarrollado con ❤️ usando Docker, Go, Python, Rust y Next.js**

**Última Revisión:** 11 de Noviembre de 2025
