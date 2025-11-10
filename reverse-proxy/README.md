# Reverse Proxy Component

This reverse proxy component uses Nginx to route traffic between the frontend components and the API Gateway.

## Architecture

The reverse proxy sits between external clients and the internal services, providing:

- **Single entry point**: All external traffic goes through port 80
- **Service isolation**: Backend services are not directly exposed to the host
- **Load balancing**: Can be extended for multiple instances
- **SSL termination**: Ready for HTTPS configuration

### Internal vs External Access

- **External clients** (browser, external APIs): Access through reverse proxy on port 80
- **Internal containers** (cli-front-end): Can access api-gateway directly on private network for better performance
  - CLI uses `http://api-gateway:8080` directly
  - No reverse proxy overhead for internal communication

## Access Points

### Default (localhost)
- **Web Frontend**: http://localhost
- **API Gateway**: http://localhost/graphql or http://localhost/api

### Using Subdomains (optional)
Add these entries to your `/etc/hosts` file for subdomain access:
```
127.0.0.1 app.localhost
127.0.0.1 api.localhost
```

Then access:
- **Web Frontend**: http://app.localhost
- **API Gateway**: http://api.localhost/graphql

## Configuration

The nginx configuration (`nginx.conf`) defines:

1. **Upstream servers**: `api-gateway:8080` and `web-front-end:3000`
2. **Server blocks**: Separate routing for API and web frontend
3. **Proxy settings**: Headers for proper request forwarding

## Routing Rules

### API Gateway Routes
- `/graphql` → api-gateway:8080/graphql
- `/api/*` → api-gateway:8080/api/*

### Web Frontend Routes
- `/` → web-front-end:3000/
- `/_next/*` → web-front-end:3000/_next/* (Next.js static files)

## Health Check

Check the reverse proxy health:
```bash
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

## Network Configuration

- **Private Network** (192.168.10.0/26): Internal services communication
- **Public Network** (172.30.0.0/24): External access through reverse proxy

Only the reverse proxy exposes port 80 to the host machine. The API Gateway (8080) and Web Frontend (3000) are only accessible internally.

## Customization

To modify routing rules, edit `nginx.conf` and rebuild:

```bash
docker-compose up -d --build reverse-proxy
```

## Security Features

- Internal services not directly exposed
- Request header sanitization
- Static file caching
- Hidden files (.env, .git) blocked
- Customizable rate limiting (add as needed)

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