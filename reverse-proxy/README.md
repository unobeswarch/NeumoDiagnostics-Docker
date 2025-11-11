# Reverse Proxy Component

This reverse proxy component uses **Nginx** to route traffic between the frontend components and the API Gateway with **HTTPS/TLS support**.

## Features

- ✅ **HTTPS/TLS termination** - SSL certificates handled at the proxy level
- ✅ **HTTP to HTTPS redirect** - All HTTP traffic automatically redirected to HTTPS
- ✅ **Domain-based routing** - Different services accessible via subdomains
- ✅ **Single entry point**: All external traffic goes through ports 80 (HTTP) and 443 (HTTPS)
- ✅ **Service isolation**: Backend services are not directly exposed to the host
- ✅ **Load balancing**: Can be extended for multiple instances
- ✅ **WebSocket support**: For Next.js hot reload and GraphQL subscriptions

## Architecture

```
Internet/Browser
       |
       | HTTPS (443) / HTTP (80)
       ↓
  Nginx Reverse Proxy (SSL/TLS Termination)
       |
       ├─→ https://localhost        → web-front-end:3000 (Next.js)
       ├─→ https://app.localhost    → web-front-end:3000 (Next.js)
       └─→ https://api.localhost    → api-gateway:8080 (GraphQL)
```

The reverse proxy sits between external clients and the internal services, providing:

- **HTTPS/TLS Termination**: Handles SSL certificates and encryption
- **HTTP to HTTPS Redirect**: Automatically redirects all HTTP traffic to HTTPS
- **Single entry point**: All external traffic goes through ports 80/443
- **Service isolation**: Backend services communicate via HTTP internally
- **Load balancing**: Can be extended for multiple instances

## SSL Certificates

The reverse proxy uses **self-signed certificates** for local development.

### Generate Certificates

**IMPORTANT**: Before starting the Docker containers for the first time, you must generate SSL certificates.

**On macOS/Linux:**
```bash
cd reverse-proxy/scripts
./generate-certs.sh
```

**On Windows:**
```cmd
cd reverse-proxy\scripts
generate-certs.bat
```

### Certificate Files

Certificates are stored in `reverse-proxy/certs/`:
- `localhost.crt` - SSL certificate
- `localhost.key` - Private key

These files are mounted into the Nginx container as read-only volumes.

### Trust the Certificate (Optional)

To avoid browser security warnings, you can add the certificate to your system's trusted certificates:

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
1. Double-click on `localhost.crt`
2. Click "Install Certificate"
3. Select "Local Machine"
4. Choose "Place all certificates in the following store"
5. Browse and select "Trusted Root Certification Authorities"
6. Complete the wizard

### Browser Security Warning

When accessing HTTPS for the first time, your browser will show a security warning because the certificate is self-signed. This is **normal for development**.

**To proceed:**
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost (unsafe)" or similar

## Access Points

### Recommended: HTTPS Access (Secure)
- **Web Frontend**: https://localhost or https://app.localhost
- **API Gateway**: https://localhost/graphql or https://api.localhost/graphql

### HTTP Access (Auto-redirects to HTTPS)
- All HTTP URLs automatically redirect to HTTPS
- http://localhost → https://localhost
- http://app.localhost → https://app.localhost
- http://api.localhost → https://api.localhost

### Direct Container Access (Bypassing Proxy)
- **Web Frontend**: http://localhost:3000 (HTTP only, development)
- **API Gateway**: Internal only (port 8080 not exposed to host)

### Using Subdomains (optional)
Add these entries to your `/etc/hosts` file for subdomain access:
```
127.0.0.1 app.localhost
127.0.0.1 api.localhost
```

## Quick Start

### 1. Generate SSL Certificates (First Time Only)

```bash
cd reverse-proxy/scripts
./generate-certs.sh  # On macOS/Linux
# or
generate-certs.bat   # On Windows
```

### 2. Start All Services

```bash
# From project root
docker-compose up -d --build
```

### 3. Access the Application

Once services are running:

- **Web Frontend**: https://localhost
- **API Gateway**: https://localhost/graphql
- **RabbitMQ Management**: http://localhost:15672

### 4. (Optional) Trust the Certificate

To avoid browser warnings, follow the instructions in the "Trust the Certificate" section above.

## Configuration

The nginx configuration (`nginx.conf`) defines:

1. **Upstream servers**: `api-gateway:8080` and `web-front-end:3000`
2. **SSL/TLS Configuration**: TLS 1.2 and 1.3 with strong ciphers
3. **Server blocks**: 
   - HTTP servers (port 80) that redirect to HTTPS
   - HTTPS servers (port 443) with SSL termination
4. **Proxy settings**: Headers for proper request forwarding including X-Forwarded-Proto

### SSL Configuration

```nginx
ssl_certificate /etc/nginx/certs/localhost.crt;
ssl_certificate_key /etc/nginx/certs/localhost.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

## Routing Rules

### HTTP to HTTPS Redirect
All HTTP (port 80) requests are automatically redirected to HTTPS (port 443):
- http://localhost → https://localhost
- http://app.localhost → https://app.localhost
- http://api.localhost → https://api.localhost

### API Gateway Routes (HTTPS)
- `/graphql` → api-gateway:8080/graphql
- `/api/*` → api-gateway:8080/api/*
- `/auth`, `/register` → api-gateway:8080/auth, /register

### Web Frontend Routes (HTTPS)
- `/` → web-front-end:3000/
- `/_next/*` → web-front-end:3000/_next/* (Next.js static files)

## Troubleshooting

### Cannot Access HTTPS

1. **Check certificates exist:**
   ```bash
   ls -la reverse-proxy/certs/
   ```
   You should see `localhost.crt` and `localhost.key`

2. **Regenerate certificates:**
   ```bash
   cd reverse-proxy/scripts
   ./generate-certs.sh
   ```

3. **Rebuild containers:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Browser Shows ERR_SSL_PROTOCOL_ERROR

- Ensure you're accessing `https://` (not `http://`)
- Check that port 443 is not blocked by firewall
- Verify certificates were generated correctly

### Certificate Not Trusted Warning

This is normal for self-signed certificates. You can either:
1. Click "Advanced" and "Proceed to localhost (unsafe)"
2. Trust the certificate system-wide (see "Trust the Certificate" section above)

## Health Check

Check the reverse proxy health:
```bash
# HTTPS (recommended)
curl -k https://localhost/health

# HTTP (will redirect to HTTPS)
curl http://localhost/health
```

## Logs

View nginx logs:
```bash
# Access logs
docker logs reverse-proxy

# Or exec into container
docker exec -it reverse-proxy tail -f /var/log/nginx/access.log
docker exec -it reverse-proxy tail -f /var/log/nginx/error.log
```

## Docker Compose Configuration

The reverse-proxy service is configured in `docker-compose.yml`:

```yaml
reverse-proxy:
  build: ./reverse-proxy
  container_name: reverse-proxy
  ports:
    - "80:80"      # HTTP
    - "443:443"    # HTTPS
  volumes:
    # Mount SSL certificates directory
    - ./reverse-proxy/certs:/etc/nginx/certs:ro
  depends_on:
    - api-gateway
    - web-front-end
  networks:
    - private
    - public
  restart: unless-stopped
```

## Network Configuration

- **Private Network** (192.168.10.0/26): Internal services communication
- **Public Network** (172.30.0.0/24): External access through reverse proxy

Only the reverse proxy exposes ports 80 (HTTP) and 443 (HTTPS) to the host machine. Backend services communicate internally via HTTP.

## Security Features

### Current (Development)
- ⚠️ Self-signed certificates (browser warnings expected)
- ⚠️ Private keys in repository (for development only)
- ✅ HTTP to HTTPS redirect
- ✅ Internal services not directly exposed
- ✅ Request header sanitization
- ✅ Static file caching
- ✅ Hidden files (.env, .git) blocked

### For Production
- ✅ Use valid SSL certificates (Let's Encrypt, AWS Certificate Manager, etc.)
- ✅ Store certificates in secrets management (not in Git)
- ✅ Enable additional security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Configure rate limiting
- ✅ Add DDoS protection
- ✅ Enable request logging and monitoring
- ✅ Implement IP whitelisting if needed

# Reverse Proxy Implementation - Quick Start Guide

## Summary

A reverse proxy component has been successfully implemented using Nginx to route traffic between the API Gateway and both frontend components (web and CLI).

## What Changed

### New Component
- **reverse-proxy**: Nginx-based reverse proxy service
  - Location: `./reverse-proxy/`
  - Port: 80 (only exposed port to host)

### Modified Services
1. **api-gateway**: No longer exposes port 8080 to host (only internal `expose: 8080`)
2. **web-front-end**: No longer exposes port 3000 to host (only internal `expose: 3000`)

## Architecture Flow

```
External Client (Browser/CLI Frontend)
        ↓
   Port 80 (Reverse Proxy)
        ↓
    ┌───┴───┐
    ↓       ↓
API Gateway  Web Frontend
(internal)   (internal)
```

### Access Patterns

1. **External Access** (Browser → Web Frontend): Through reverse proxy
2. **External API Calls** (Browser → API Gateway): Through reverse proxy  
3. **CLI Frontend** (CLI → API Gateway): Through reverse proxy on public network

## How to Use

### 1. Start All Services
```bash
docker-compose up -d
```

### 2. Access Points

#### Web Frontend
- **URL**: http://localhost
- **Alternative**: http://app.localhost (add to /etc/hosts)

#### API Gateway
- **GraphQL**: http://localhost/graphql
- **API routes**: http://localhost/api/*
- **Alternative**: http://api.localhost/graphql

#### CLI Frontend
- **Access**: 
  ```bash
  docker exec -it cli-front-end /app/cli-front-end
  ```
- **API Access**: Uses `http://reverse-proxy/graphql` (configured via `API_GATEWAY_URL` env var)
- **Network**: Public network, accesses API through reverse proxy

#### Health Check
```bash
curl http://localhost/health
```

### 3. Optional: Configure Subdomain Access

Edit `/etc/hosts`:
```bash
sudo nano /etc/hosts
```

Add these lines:
```
127.0.0.1 app.localhost
127.0.0.1 api.localhost
```

## Benefits

✅ **Single Entry Point**: All traffic through port 80 (including CLI)  
✅ **Security**: Backend services not directly exposed to host  
✅ **Scalability**: Easy to add load balancing  
✅ **Flexibility**: Simple routing configuration  
✅ **SSL Ready**: Easy to add HTTPS certificates  
✅ **Centralized Logging**: All requests logged in one place  
✅ **Consistent Access**: All clients use the same entry point  

## CLI Frontend Configuration

The CLI frontend now routes through the reverse proxy for consistency:

### Current Configuration ✅
```yaml
environment:
  API_GATEWAY_URL: "http://reverse-proxy/graphql"
networks:
  - public
```
- **Pros**: Centralized logging, consistent routing, unified access control
- **Network**: Public network only (no direct backend access)

To change modes, update the `API_GATEWAY_URL` in docker-compose.yml and restart:
```bash
docker-compose up -d cli-front-end
```  

## Troubleshooting

### Check Reverse Proxy Status
```bash
docker ps | grep reverse-proxy
docker logs reverse-proxy
```

### Test Connectivity
```bash
# Test API Gateway through proxy
curl http://localhost/graphql

# Test Web Frontend through proxy
curl http://localhost
```

### Rebuild After Configuration Changes
```bash
docker-compose up -d --build reverse-proxy
```

## Files Created

- `reverse-proxy/Dockerfile` - Container definition
- `reverse-proxy/nginx.conf` - Nginx routing configuration
- `reverse-proxy/README.md` - Detailed documentation
- `reverse-proxy/.dockerignore` - Build optimization

## Next Steps

1. **Start the system**: 
   ```bash
   docker-compose up -d
   ```

2. **Access web frontend**: 
   ```bash
   open http://localhost
   ```

3. **Access GraphQL API**: 
   ```bash
   curl http://localhost/graphql
   ```

4. **Use CLI frontend**:
   ```bash
   docker exec -it cli-front-end /app/cli-front-end
   ```
   The CLI automatically connects to API Gateway at `http://api-gateway:8080`

5. **Update frontend API endpoints** to use proxy:
   - Change API calls from `http://localhost:8080/graphql` 
   - To: `http://localhost/graphql`

## Documentation

For detailed information, see:
- **`reverse-proxy/README.md`** - Reverse proxy component details
- **`NETWORK_ARCHITECTURE.md`** - Complete network diagram and flow
- **`docker-compose.yml`** - Service configuration

## Network Configuration

- **Private Network** (192.168.10.0/26): Internal services only
- **Public Network** (172.30.0.0/24): Reverse proxy + frontends
- Only port 80 exposed to host machine

For more details, see `reverse-proxy/README.md`.