# Test Script para verificar HTTPS en Reverse Proxy
# Ejecutar: .\test-https-proxy.ps1

Write-Host "`n" -NoNewline
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔒 Test HTTPS - Reverse Proxy" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$testsRun = 0
$testsPassed = 0
$testsFailed = 0

function Test-Item {
    param (
        [string]$TestName,
        [scriptblock]$TestBlock
    )
    
    $script:testsRun++
    Write-Host "Test $testsRun`: $TestName" -ForegroundColor Yellow
    
    try {
        $result = & $TestBlock
        if ($result) {
            Write-Host "  ✅ PASSED" -ForegroundColor Green
            $script:testsPassed++
        } else {
            Write-Host "  ❌ FAILED" -ForegroundColor Red
            $script:testsFailed++
        }
    } catch {
        Write-Host "  ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
    }
    Write-Host ""
}

# Test 1: Verificar Docker está corriendo
Test-Item "Docker Desktop está corriendo" {
    try {
        docker ps | Out-Null
        $true
    } catch {
        Write-Host "  ⚠️  Inicia Docker Desktop primero" -ForegroundColor Yellow
        $false
    }
}

# Test 2: Verificar certificados existen
Test-Item "Certificados generados" {
    $files = @(
        "reverse-proxy/certs/reverse-proxy.key",
        "reverse-proxy/certs/reverse-proxy.crt",
        "reverse-proxy/certs/rootCA.pem"
    )
    
    $allExist = $true
    foreach ($file in $files) {
        if (-not (Test-Path $file)) {
            Write-Host "  ⚠️  Falta: $file" -ForegroundColor Yellow
            $allExist = $false
        }
    }
    
    if ($allExist) {
        Write-Host "  ℹ️  Todos los certificados presentes" -ForegroundColor Cyan
    }
    
    $allExist
}

# Test 3: Verificar reverse-proxy está corriendo
Test-Item "Contenedor reverse-proxy está corriendo" {
    $container = docker ps --filter "name=reverse-proxy" --format "{{.Names}}" 2>$null
    if ($container -eq "reverse-proxy") {
        Write-Host "  ℹ️  Contenedor activo" -ForegroundColor Cyan
        $true
    } else {
        Write-Host "  ⚠️  Ejecuta: docker-compose up -d reverse-proxy" -ForegroundColor Yellow
        $false
    }
}

# Test 4: Verificar puerto 443 expuesto
Test-Item "Puerto 443 expuesto" {
    $port = docker port reverse-proxy 443 2>$null
    if ($port) {
        Write-Host "  ℹ️  Puerto 443 mapeado a: $port" -ForegroundColor Cyan
        $true
    } else {
        Write-Host "  ⚠️  Puerto 443 no expuesto" -ForegroundColor Yellow
        $false
    }
}

# Test 5: Verificar configuración Nginx
Test-Item "Configuración Nginx válida" {
    $result = docker exec reverse-proxy nginx -t 2>&1
    if ($result -match "successful") {
        Write-Host "  ℹ️  Configuración válida" -ForegroundColor Cyan
        $true
    } else {
        Write-Host "  ⚠️  Error en configuración: $result" -ForegroundColor Yellow
        $false
    }
}

# Test 6: Verificar certificados en contenedor
Test-Item "Certificados montados en contenedor" {
    $files = docker exec reverse-proxy ls /etc/nginx/certs/ 2>$null
    if ($files -match "reverse-proxy.crt" -and $files -match "reverse-proxy.key") {
        Write-Host "  ℹ️  Certificados montados correctamente" -ForegroundColor Cyan
        $true
    } else {
        Write-Host "  ⚠️  Certificados no encontrados en contenedor" -ForegroundColor Yellow
        $false
    }
}

# Test 7: Test conexión HTTPS
Test-Item "Conexión HTTPS al puerto 443" {
    try {
        $response = curl.exe -k -s -o NUL -w "%{http_code}" https://localhost:443/health 2>$null
        if ($response -eq "200") {
            Write-Host "  ℹ️  HTTPS respondiendo correctamente" -ForegroundColor Cyan
            $true
        } else {
            Write-Host "  ⚠️  Código HTTP: $response" -ForegroundColor Yellow
            $false
        }
    } catch {
        Write-Host "  ⚠️  No se pudo conectar" -ForegroundColor Yellow
        $false
    }
}

# Test 8: Test redirect HTTP → HTTPS
Test-Item "HTTP redirect a HTTPS" {
    try {
        $response = curl.exe -s -I http://localhost:80/health 2>$null | Select-String "301|Location"
        if ($response -match "301" -or $response -match "https://") {
            Write-Host "  ℹ️  Redirect funcionando" -ForegroundColor Cyan
            $true
        } else {
            Write-Host "  ⚠️  Redirect no detectado" -ForegroundColor Yellow
            $false
        }
    } catch {
        Write-Host "  ⚠️  No se pudo probar redirect" -ForegroundColor Yellow
        $false
    }
}

# Test 9: Verificar Security Headers
Test-Item "Security Headers presentes" {
    try {
        $headers = curl.exe -k -s -I https://localhost:443/health 2>$null
        $hasHSTS = $headers -match "Strict-Transport-Security"
        $hasXFrame = $headers -match "X-Frame-Options"
        
        if ($hasHSTS -and $hasXFrame) {
            Write-Host "  ℹ️  HSTS y X-Frame-Options presentes" -ForegroundColor Cyan
            $true
        } else {
            Write-Host "  ⚠️  Faltan algunos security headers" -ForegroundColor Yellow
            $false
        }
    } catch {
        Write-Host "  ⚠️  No se pudieron verificar headers" -ForegroundColor Yellow
        $false
    }
}

# Test 10: Verificar Load Balancing
Test-Item "Load Balancing configurado" {
    try {
        $config = docker exec reverse-proxy cat /etc/nginx/nginx.conf 2>$null
        if ($config -match "api-gateway-1" -and $config -match "api-gateway-2" -and $config -match "api-gateway-3") {
            Write-Host "  ℹ️  3 api-gateways configurados" -ForegroundColor Cyan
            $true
        } else {
            Write-Host "  ⚠️  Load balancing no completo" -ForegroundColor Yellow
            $false
        }
    } catch {
        Write-Host "  ⚠️  No se pudo verificar configuración" -ForegroundColor Yellow
        $false
    }
}

# Test 11: Verificar web-front-end usa HTTPS
Test-Item "Frontend configurado para HTTPS" {
    $compose = Get-Content docker-compose.yml -Raw
    if ($compose -match "NEXT_PUBLIC_API_URL=https://reverse-proxy") {
        Write-Host "  ℹ️  Frontend usa https://reverse-proxy" -ForegroundColor Cyan
        $true
    } else {
        Write-Host "  ⚠️  Frontend no actualizado" -ForegroundColor Yellow
        $false
    }
}

# Test 12: Test desde web-front-end (si está corriendo)
Test-Item "Frontend puede conectarse al proxy (opcional)" {
    $frontendRunning = docker ps --filter "name=web-front-end" --format "{{.Names}}" 2>$null
    if ($frontendRunning -eq "web-front-end") {
        try {
            $response = docker exec web-front-end curl -k -s -o /dev/null -w "%{http_code}" https://reverse-proxy/health 2>$null
            if ($response -eq "200") {
                Write-Host "  ℹ️  Frontend → Proxy HTTPS funciona" -ForegroundColor Cyan
                $true
            } else {
                Write-Host "  ⚠️  Respuesta: $response" -ForegroundColor Yellow
                $false
            }
        } catch {
            Write-Host "  ⚠️  No se pudo probar desde frontend" -ForegroundColor Yellow
            $false
        }
    } else {
        Write-Host "  ℹ️  Frontend no está corriendo (opcional)" -ForegroundColor Cyan
        $true  # No es un error si frontend no está corriendo
    }
}

# Resumen
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 Resumen de Tests" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Tests ejecutados: $testsRun" -ForegroundColor White
Write-Host "  ✅ Passed: $testsPassed" -ForegroundColor Green
Write-Host "  ❌ Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 ¡Todos los tests pasaron! HTTPS está funcionando correctamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Tu arquitectura ahora es:" -ForegroundColor Cyan
    Write-Host "   User → 🔒 HTTPS → Frontend → 🔒 HTTPS → Reverse Proxy → HTTP → Backend" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Algunos tests fallaron. Revisa los detalles arriba." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Soluciones comunes:" -ForegroundColor Cyan
    Write-Host "   1. Asegúrate de que Docker Desktop está corriendo" -ForegroundColor White
    Write-Host "   2. Ejecuta: docker-compose up --build -d reverse-proxy" -ForegroundColor White
    Write-Host "   3. Verifica logs: docker logs reverse-proxy" -ForegroundColor White
    Write-Host ""
}

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

