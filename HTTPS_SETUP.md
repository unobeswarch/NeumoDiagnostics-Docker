# HTTPS Setup Guide - NeumoDiagnostics

## ✅ Implementación Completada

El sistema ahora cuenta con soporte completo para HTTPS a través del reverse proxy Nginx.

## 🎯 Características Implementadas

- ✅ **HTTPS/TLS en reverse proxy** - Certificados SSL manejados centralizadamente
- ✅ **Redirección HTTP → HTTPS** - Todo el tráfico HTTP se redirige automáticamente a HTTPS
- ✅ **Comunicación interna HTTP** - Los servicios internos se comunican vía HTTP (sin overhead SSL)
- ✅ **Certificados auto-firmados** - Para desarrollo local
- ✅ **Scripts de generación** - Herramientas para macOS, Linux y Windows

## 🚀 Inicio Rápido

### 1. Generar Certificados SSL (Primera Vez)

**macOS/Linux:**
```bash
cd reverse-proxy/scripts
./generate-certs.sh
```

**Windows:**
```cmd
cd reverse-proxy\scripts
generate-certs.bat
```

### 2. Iniciar los Servicios

```bash
docker-compose up -d --build
```

### 3. Acceder a la Aplicación

- **Web Frontend**: https://localhost
- **API Gateway**: https://localhost/graphql
- **Acceso Directo (sin proxy)**: http://localhost:3000

## 🔒 Manejo de Advertencia del Navegador

La primera vez que accedas a https://localhost, verás una advertencia de seguridad. Esto es **normal** porque estamos usando certificados auto-firmados para desarrollo.

### Opción 1: Aceptar el Riesgo (Más Rápido)

1. Click en "Advanced" o "Avanzado"
2. Click en "Proceed to localhost (unsafe)" o "Continuar a localhost (no seguro)"

### Opción 2: Confiar en el Certificado (Recomendado)

**macOS:**
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain \
  reverse-proxy/certs/localhost.crt
```

**Linux:**
```bash
sudo cp reverse-proxy/certs/localhost.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

**Windows:**
1. Doble click en `reverse-proxy/certs/localhost.crt`
2. Click "Instalar Certificado"
3. Seleccionar "Equipo Local"
4. Elegir "Colocar todos los certificados en el siguiente almacén"
5. Buscar y seleccionar "Entidades de certificación raíz de confianza"
6. Completar el asistente
7. Reiniciar el navegador

## 🌐 URLs de Acceso

### HTTPS (Recomendado)
- Web Frontend: https://localhost
- API GraphQL: https://localhost/graphql
- API REST: https://localhost/api

### HTTP (Se redirige automáticamente a HTTPS)
- http://localhost → https://localhost
- http://app.localhost → https://app.localhost
- http://api.localhost → https://api.localhost

### Acceso Directo a Contenedores (Sin Proxy)
- Web Frontend: http://localhost:3000
- API Gateway: No expuesto (solo interno en puerto 8080)

## 📁 Archivos Importantes

```
reverse-proxy/
├── certs/
│   ├── localhost.crt       # Certificado SSL (generado)
│   └── localhost.key       # Clave privada (generado)
├── scripts/
│   ├── generate-certs.sh   # Script para macOS/Linux
│   └── generate-certs.bat  # Script para Windows
├── nginx.conf              # Configuración con HTTPS
├── Dockerfile              # Imagen con soporte SSL
└── README.md               # Documentación detallada
```

## 🔧 Arquitectura

```
Navegador
    |
    | HTTPS (443) / HTTP (80)
    ↓
Nginx Reverse Proxy (Terminación SSL/TLS)
    |
    | HTTP (interno)
    ↓
    ├─→ web-front-end:3000 (Next.js)
    └─→ api-gateway:8080 (GraphQL)
```

**Ventajas de esta arquitectura:**
- ✅ Un solo punto de terminación SSL (simplifica gestión de certificados)
- ✅ Comunicación interna sin overhead de encriptación
- ✅ Fácil escalamiento horizontal
- ✅ Certificados centralizados en el proxy

## 🛠️ Resolución de Problemas

### No puedo acceder a HTTPS

1. **Verificar que los certificados existan:**
   ```bash
   ls -la reverse-proxy/certs/
   ```
   Deberías ver `localhost.crt` y `localhost.key`

2. **Regenerar certificados:**
   ```bash
   cd reverse-proxy/scripts
   ./generate-certs.sh
   ```

3. **Reconstruir contenedores:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Error ERR_SSL_PROTOCOL_ERROR

- Asegúrate de usar `https://` (no `http://`)
- Verifica que el puerto 443 no esté bloqueado por el firewall
- Confirma que los certificados se generaron correctamente

### El navegador sigue mostrando advertencia

- Esto es normal para certificados auto-firmados
- Opciones:
  1. Acepta la advertencia y continúa
  2. Confía en el certificado a nivel del sistema (ver instrucciones arriba)

### Los servicios no responden

1. **Verificar que todos los contenedores estén corriendo:**
   ```bash
   docker-compose ps
   ```

2. **Ver logs del reverse proxy:**
   ```bash
   docker-compose logs reverse-proxy
   ```

3. **Ver logs de los servicios backend:**
   ```bash
   docker-compose logs web-front-end
   docker-compose logs api-gateway
   ```

## 🔐 Seguridad

### Ambiente de Desarrollo (Actual)
- ⚠️ Certificados auto-firmados (advertencias del navegador)
- ⚠️ Claves privadas en el repositorio (solo para desarrollo)
- ✅ Redirección HTTP → HTTPS
- ✅ Servicios backend no expuestos directamente

### Para Producción (Futuro)
- ✅ Usar certificados válidos (Let's Encrypt, AWS Certificate Manager, etc.)
- ✅ Almacenar certificados en gestión de secretos (no en Git)
- ✅ Habilitar headers de seguridad adicionales (HSTS, CSP, etc.)
- ✅ Configurar rate limiting
- ✅ Agregar protección DDoS
- ✅ Implementar monitoreo y logging

## 📚 Documentación Adicional

- **Detalles del Reverse Proxy**: `reverse-proxy/README.md`
- **Configuración Docker**: `docker-compose.yml`
- **Configuración Nginx**: `reverse-proxy/nginx.conf`

## ✨ Cambios Realizados

### Archivos Modificados
- `docker-compose.yml` - Agregado puerto 443 y volumen de certificados
- `reverse-proxy/nginx.conf` - Configuración HTTPS con redirección
- `reverse-proxy/Dockerfile` - Soporte para certificados SSL
- `reverse-proxy/README.md` - Documentación actualizada

### Archivos Nuevos
- `reverse-proxy/scripts/generate-certs.sh` - Script para generar certificados (macOS/Linux)
- `reverse-proxy/scripts/generate-certs.bat` - Script para generar certificados (Windows)
- `reverse-proxy/certs/` - Directorio para certificados (gitignored)
- `HTTPS_SETUP.md` - Esta guía

## 🎉 Próximos Pasos

1. **Iniciar el sistema:**
   ```bash
   docker-compose up -d
   ```

2. **Abrir el navegador:**
   ```bash
   # macOS
   open https://localhost
   
   # Linux
   xdg-open https://localhost
   
   # Windows
   start https://localhost
   ```

3. **Aceptar la advertencia del certificado** (primera vez)

4. **¡Disfrutar de tu aplicación con HTTPS!** 🚀

## 📞 Soporte

Si encuentras problemas:
1. Revisa esta guía
2. Consulta `reverse-proxy/README.md` para detalles técnicos
3. Verifica los logs: `docker-compose logs`
