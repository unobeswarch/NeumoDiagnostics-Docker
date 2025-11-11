#!/bin/bash

# Script para probar el Load Balancer del API Gateway
# Compatible con Bash 3.2+ (macOS)

# Timeout global (60 segundos)
TIMEOUT=60
START_TIME=$(date +%s)

# Contadores
count_gateway_1=0
count_gateway_2=0
count_gateway_3=0
success_count=0
fail_count=0

# Función para verificar timeout
check_timeout() {
    current_time=$(date +%s)
    elapsed=$((current_time - START_TIME))
    if [ $elapsed -gt $TIMEOUT ]; then
        echo ""
        echo "⚠️  TIMEOUT: El proceso superó los 60 segundos"
        echo "🔍 Diagnosticando el problema..."
        echo ""
        
        # Diagnóstico
        echo "📊 Estado de contenedores:"
        docker ps --filter "name=api-gateway-\|reverse-proxy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "🔍 Verificando conectividad al reverse-proxy:"
        curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" --max-time 5 http://localhost/health || echo "❌ No se puede conectar al reverse-proxy"
        echo ""
        
        echo "📋 Últimas líneas del log de nginx:"
        docker exec reverse-proxy tail -5 /var/log/nginx/error.log 2>/dev/null || echo "❌ No se pueden leer los logs"
        echo ""
        
        echo "💡 Posibles causas:"
        echo "   1. Reverse-proxy no responde"
        echo "   2. API Gateway instances no están disponibles"
        echo "   3. Problemas de red entre contenedores"
        echo "   4. Nginx bloqueado esperando upstream"
        echo ""
        
        exit 1
    fi
}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Load Balancer Test - API Gateway Instances            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que las 3 instancias están corriendo
echo "🔍 Verificando instancias del API Gateway..."
instances=$(docker ps --filter "name=api-gateway-" --format "{{.Names}}" 2>/dev/null | wc -l | tr -d ' ')

if [ "$instances" -eq 3 ]; then
    echo "✅ Las 3 instancias están activas:"
    docker ps --filter "name=api-gateway-" --format "   - {{.Names}} ({{.Status}})"
else
    echo "⚠️  Solo $instances instancias están activas"
    docker ps --filter "name=api-gateway-" --format "   - {{.Names}} ({{.Status}})"
fi
echo ""

# Obtener IPs de las instancias
echo "📋 IPs de las instancias en la red privada:"
ip_gateway_1=$(docker inspect api-gateway-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
ip_gateway_2=$(docker inspect api-gateway-2 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
ip_gateway_3=$(docker inspect api-gateway-3 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)

[ -n "$ip_gateway_1" ] && echo "   api-gateway-1: $ip_gateway_1"
[ -n "$ip_gateway_2" ] && echo "   api-gateway-2: $ip_gateway_2"
[ -n "$ip_gateway_3" ] && echo "   api-gateway-3: $ip_gateway_3"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Probando Load Balancer                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "🔄 Realizando 30 peticiones al endpoint /auth..."
echo "⏱️  Timeout configurado: 60 segundos"
echo ""

# Contador de peticiones
count_gateway_1=0
count_gateway_2=0
count_gateway_3=0
success_count=0
fail_count=0

# Hacer 30 peticiones para ver mejor la distribución weighted
for i in {1..30}; do
    # Verificar timeout global
    check_timeout
    
    echo -n "   Request $i: "
    
    # Hacer petición y capturar headers
    response=$(curl -s -i --max-time 5 -X POST http://localhost/auth \
        -H "Content-Type: application/json" \
        -d '{"correo":"test@test.com","contrasena":"test"}' 2>&1)
    
    curl_exit=$?
    
    if [ $curl_exit -eq 28 ]; then
        echo "❌ TIMEOUT (>5s)"
        fail_count=$((fail_count + 1))
        continue
    elif [ $curl_exit -ne 0 ]; then
        echo "❌ ERROR (exit code: $curl_exit)"
        fail_count=$((fail_count + 1))
        continue
    fi
    
    # Extraer HTTP code de los headers
    http_code=$(echo "$response" | grep "HTTP/" | cut -d' ' -f2)
    
    # Extraer la IP del upstream del header X-Upstream-Server
    upstream_ip=$(echo "$response" | grep -i "X-Upstream-Server" | cut -d' ' -f2 | grep -o '192\.168\.10\.[0-9]*' | head -1 | tr -d '\r')
    
    if [ -n "$upstream_ip" ]; then
        # Incrementar contador según la IP
        if [ "$upstream_ip" = "$ip_gateway_1" ]; then
            count_gateway_1=$((count_gateway_1 + 1))
            echo "✅ HTTP $http_code → $upstream_ip (api-gateway-1)"
        elif [ "$upstream_ip" = "$ip_gateway_2" ]; then
            count_gateway_2=$((count_gateway_2 + 1))
            echo "✅ HTTP $http_code → $upstream_ip (api-gateway-2)"
        elif [ "$upstream_ip" = "$ip_gateway_3" ]; then
            count_gateway_3=$((count_gateway_3 + 1))
            echo "✅ HTTP $http_code → $upstream_ip (api-gateway-3)"
        else
            echo "⚠️  HTTP $http_code → $upstream_ip (unknown)"
        fi
        success_count=$((success_count + 1))
    else
        echo "⚠️  HTTP $http_code → (no upstream info)"
        success_count=$((success_count + 1))
    fi
    
    sleep 0.2
done

echo ""
echo "📊 Distribución de peticiones por instancia:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mostrar estadísticas de éxito/fallo
echo ""
echo "📈 Resumen de peticiones:"
echo "   ✅ Exitosas: $success_count/30"
echo "   ❌ Fallidas: $fail_count/30"
echo ""

# Calcular total rastreado
total=$((count_gateway_1 + count_gateway_2 + count_gateway_3))

if [ $total -gt 0 ]; then
    echo "🎯 Distribución por instancia:"
    
    # Calcular porcentajes
    if [ $count_gateway_1 -gt 0 ]; then
        percent_1=$(echo "scale=1; ($count_gateway_1 * 100) / $total" | bc)
        printf "   %-20s (%s): %2d peticiones (%5.1f%%)\n" "api-gateway-1" "$ip_gateway_1" "$count_gateway_1" "$percent_1"
    fi
    
    if [ $count_gateway_2 -gt 0 ]; then
        percent_2=$(echo "scale=1; ($count_gateway_2 * 100) / $total" | bc)
        printf "   %-20s (%s): %2d peticiones (%5.1f%%)\n" "api-gateway-2" "$ip_gateway_2" "$count_gateway_2" "$percent_2"
    fi
    
    if [ $count_gateway_3 -gt 0 ]; then
        percent_3=$(echo "scale=1; ($count_gateway_3 * 100) / $total" | bc)
        printf "   %-20s (%s): %2d peticiones (%5.1f%%)\n" "api-gateway-3" "$ip_gateway_3" "$count_gateway_3" "$percent_3"
    fi
    
    echo ""
    echo "   Total rastreadas: $total peticiones"
else
    echo "   ⚠️  No se pudo obtener información de distribución desde los logs"
    echo "   💡 Esto puede ocurrir si los logs no son accesibles o hay latencia"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 Configuración del Load Balancer:"
echo "   - Algoritmo: weighted round robin (pesos 3:2:1)"
echo "   - api-gateway-1: weight=3 (~50%)"
echo "   - api-gateway-2: weight=2 (~33%)"
echo "   - api-gateway-3: weight=1 (~17%)"
echo "   - Health checks: max_fails=3, fail_timeout=30s"
echo "   - Keepalive: deshabilitado (para distribución precisa)"
echo ""

# Tiempo total
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
echo "⏱️  Tiempo total de ejecución: ${TOTAL_TIME}s"
echo ""

if [ $success_count -eq 30 ]; then
    echo "✅ Test completado exitosamente"
else
    echo "⚠️  Test completado con advertencias"
fi
echo ""
echo "💡 Tip: Con weighted round robin, api-gateway-1 debería recibir"
echo "   aproximadamente el 50% de las peticiones, api-gateway-2 el 33%,"
echo "   y api-gateway-3 el 17%"
echo ""
echo ""
