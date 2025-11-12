# Resumen de la Sesión - Implementación Load Balancer
**Fecha:** 11 de Noviembre de 2025  
**Branch:** feaature/loadbalancer

---

## 📋 Tareas Completadas

### 1. Consolidación de Documentación
- ✅ Eliminados múltiples archivos .md redundantes
- ✅ Consolidado todo en un único `README.md` completo
- ✅ Mantenido `STATUS.txt` como archivo de estado

**Archivos eliminados:**
- ARCHITECTURE.md
- IMPLEMENTATION_SUMMARY.md
- HTTPS_USAGE.md
- CLI_FRONTEND_CONFIG.md
- STATUS_HTTPS.md
- TEST_RESULTS_CLI.md
- QUICK_START.md
- HTTPS_SETUP.md

### 2. Configuración del Load Balancer

#### Cambio de Algoritmo
**Antes:** `least_conn` (menos conexiones activas)  
**Después:** `weighted round robin` con pesos 3:2:1

#### Configuración de Nginx (`reverse-proxy/nginx.conf`)
```nginx
upstream api_gateway {
    # Load balancing method: weighted round robin
    # Weight determines the proportion of requests each server receives
    # Higher weight = more requests
    
    # API Gateway instances with weights
    server api-gateway-1:8080 weight=3 max_fails=3 fail_timeout=30s;
    server api-gateway-2:8080 weight=2 max_fails=3 fail_timeout=30s;
    server api-gateway-3:8080 weight=1 max_fails=3 fail_timeout=30s;
    
    # Keepalive disabled to ensure proper weighted distribution
    # Each request will use a new connection
}
```

**Cambios clave:**
- Removido `keepalive 32` del upstream
- Cambiado `Connection 'upgrade'` por `Connection "close"` en locations `/graphql` y `/api/`
- Añadidos weights: 3, 2, 1 a cada instancia

### 3. Script de Prueba del Load Balancer

#### Creación de `test-loadbalancer.sh`

**Características:**
- ✅ Compatible con macOS (Bash 3.2+)
- ✅ Sin dependencias de comandos no disponibles (`timeout`, `declare -A`)
- ✅ Usa el header `X-Upstream-Server` de nginx para tracking
- ✅ Timeout global de 60 segundos con diagnóstico automático
- ✅ Realiza 30 peticiones para mejor visualización de distribución
- ✅ Calcula porcentajes de distribución
- ✅ Muestra resumen completo con estadísticas

**Resultado de las pruebas:**
```
🎯 Distribución por instancia:
   api-gateway-1 (192.168.10.11): 15 peticiones ( 50.0%)
   api-gateway-2 (192.168.10.4):  10 peticiones ( 33.3%)
   api-gateway-3 (192.168.10.3):   5 peticiones ( 16.6%)
```

✅ **Distribución perfecta según los pesos 3:2:1**

### 4. Corrección de Problemas

#### Problema 1: Arrays asociativos no soportados
**Error:** `declare: -A: invalid option`  
**Causa:** macOS usa Bash 3.2 que no soporta arrays asociativos  
**Solución:** Reescrito el script usando variables simples y condicionales

#### Problema 2: Comando `timeout` no disponible
**Error:** `timeout: command not found` (exit code 127)  
**Causa:** macOS no incluye el comando GNU `timeout`  
**Solución:** Uso de `--max-time` de curl (exit code 28 para timeout)

#### Problema 3: Distribución uniforme en lugar de weighted
**Error:** Todas las instancias recibían 33.3% de las peticiones  
**Causa:** `keepalive` hace que nginx reutilice conexiones  
**Solución:** 
- Removido `keepalive 32` del upstream
- Cambiado headers de conexión a `Connection "close"`
- Reconstruir imagen con `docker-compose up -d --build reverse-proxy`

#### Problema 4: Configuración no se aplicaba
**Error:** `nginx.conf` del contenedor tenía configuración antigua  
**Causa:** Reverse-proxy usa `build` y copia el archivo durante build  
**Solución:** `docker-compose up -d --build reverse-proxy` en lugar de solo `restart`

#### Problema 5: Git corrupto - Bus Error
**Error:** `zsh: bus error git status` (exit code 138)  
**Causa:** Archivo `.git/index` corrupto  
**Solución:** 
1. Respaldo del directorio: `mv NeumoDiagnostics-Docker NeumoDiagnostics-Docker-backup`
2. Re-clonar repositorio: `git clone https://github.com/unobeswarch/NeumoDiagnostics-Docker.git`
3. Checkout branch: `git checkout feaature/loadbalancer`
4. Copiar archivos modificados del backup

---

## 🏗️ Arquitectura Final

### Load Balancer Configuration

```
┌─────────────────────────────────────────────┐
│          Reverse Proxy (Nginx)              │
│         Weighted Round Robin                │
└────────┬────────────┬─────────────┬─────────┘
         │            │             │
         │ 50%        │ 33%         │ 17%
         │            │             │
    ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
    │Gateway-1│  │Gateway-2│  │Gateway-3│
    │weight=3 │  │weight=2 │  │weight=1 │
    │:10.11   │  │:10.4    │  │:10.3    │
    └─────────┘  └─────────┘  └─────────┘
```

### IPs de las Instancias
- `api-gateway-1`: 192.168.10.11 (weight=3, ~50%)
- `api-gateway-2`: 192.168.10.4 (weight=2, ~33%)
- `api-gateway-3`: 192.168.10.3 (weight=1, ~17%)

---

## 📁 Archivos Modificados

1. **docker-compose.yml**
   - Añadidas 3 instancias del API Gateway
   - Actualizado reverse-proxy dependencies

2. **reverse-proxy/nginx.conf**
   - Configurado weighted round robin
   - Removido keepalive
   - Actualizado Connection headers

3. **README.md**
   - Documentación completa consolidada
   - Sección de Load Balancer
   - Guía de troubleshooting
   - Comandos útiles

4. **test-loadbalancer.sh** (nuevo)
   - Script de prueba compatible con macOS
   - Tracking de distribución
   - Diagnóstico automático

---

## 🧪 Comandos de Prueba

### Iniciar el sistema
```bash
docker-compose up -d --build
```

### Probar el load balancer
```bash
./test-loadbalancer.sh
```

### Verificar distribución manualmente
```bash
for i in {1..30}; do
    curl -s -i -X POST http://localhost/auth \
        -H "Content-Type: application/json" \
        -d '{"correo":"test","contrasena":"test"}' | \
        grep "X-Upstream-Server"
done
```

### Ver logs del reverse-proxy
```bash
docker logs reverse-proxy -f
```

### Verificar instancias activas
```bash
docker ps | grep api-gateway
```

---

## 🔧 Troubleshooting Aplicado

### Si la distribución no funciona:
1. Verificar que keepalive está deshabilitado
2. Reconstruir imagen: `docker-compose up -d --build reverse-proxy`
3. Verificar configuración: `docker exec reverse-proxy cat /etc/nginx/nginx.conf | grep -A 12 upstream`

### Si git no funciona (bus error):
1. Verificar `ls -la .git/index.lock`
2. Si existe lock: `rm .git/index.lock`
3. Si persiste: re-clonar repositorio y copiar cambios

---

## 📊 Métricas de Éxito

- ✅ 30/30 peticiones exitosas (100%)
- ✅ Distribución exacta: 50% / 33.3% / 16.6%
- ✅ 0 fallos de timeout
- ✅ Tiempo de ejecución: ~7 segundos
- ✅ Load balancer funcionando correctamente

---

## 🎯 Próximos Pasos Sugeridos

1. Probar con carga real desde web frontend
2. Monitorear logs en producción
3. Ajustar weights según capacidad real de los servidores
4. Considerar añadir más instancias si es necesario
5. Implementar health checks activos
6. Configurar alertas para instancias caídas

---

## 📝 Notas Importantes

- **Keepalive deshabilitado:** Esto asegura distribución precisa pero puede afectar performance levemente
- **Pesos ajustables:** Los weights (3:2:1) se pueden cambiar según necesidad
- **Compatibilidad macOS:** Script probado en macOS con Bash 3.2
- **Docker Desktop:** Sistema funciona correctamente en Docker Desktop para Mac

---

**Documentación generada:** 11 de Noviembre de 2025  
**Branch:** feaature/loadbalancer  
**PR:** https://github.com/unobeswarch/NeumoDiagnostics-Docker/pull/8
