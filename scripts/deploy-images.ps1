# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - DEPLOY IMAGES TO ECR
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [string]$Region = "us-east-1",
    [string]$AccountId = "566115828526",
    [string]$Tag = "latest",
    [switch]$SkipBuild,
    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"

# Colores para output
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACION
# ─────────────────────────────────────────────────────────────────────────────
$ECR_REGISTRY = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Servicios a desplegar (nombre del directorio => nombre del repositorio ECR)
$SERVICES = @{
    "api-gateway"      = "neumo/api-gateway"
    "auth-be"          = "neumo/auth-be"
    "prediagnostic-be" = "neumo/prediagnostic-be"
    "notification-be"  = "neumo/notification-be"
    "message-producer" = "neumo/message-producer"
    "web-front-end"    = "neumo/web-frontend"
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "       NEUMODIAGNOSTICS - DEPLOY TO AWS ECR" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Info "Registry: $ECR_REGISTRY"
Write-Info "Tag: $Tag"
Write-Info "Project Root: $PROJECT_ROOT"
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# PASO 1: LOGIN A ECR
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "PASO 1: Autenticacion en ECR" -ForegroundColor White
Write-Host "----------------------------------------------------------------" -ForegroundColor Gray

try {
    Write-Info "Obteniendo token de ECR..."
    $password = aws ecr get-login-password --region $Region
    $password | docker login --username AWS --password-stdin $ECR_REGISTRY
    Write-Success "Login exitoso en ECR"
}
catch {
    Write-Err "Error al autenticar en ECR: $_"
    exit 1
}

# ─────────────────────────────────────────────────────────────────────────────
# PASO 2: BUILD Y PUSH DE CADA SERVICIO
# ─────────────────────────────────────────────────────────────────────────────
$successCount = 0
$failCount = 0

foreach ($service in $SERVICES.GetEnumerator()) {
    $serviceName = $service.Key
    $repoName = $service.Value
    $serviceDir = Join-Path $PROJECT_ROOT $serviceName
    $fullImageName = "$ECR_REGISTRY/${repoName}:$Tag"
    
    Write-Host ""
    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "SERVICIO: $serviceName" -ForegroundColor White
    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
    
    # Verificar que existe el directorio
    if (-not (Test-Path $serviceDir)) {
        Write-Warn "Directorio no encontrado: $serviceDir"
        $failCount++
        continue
    }
    
    # Verificar que existe Dockerfile
    $dockerfile = Join-Path $serviceDir "Dockerfile"
    if (-not (Test-Path $dockerfile)) {
        Write-Warn "Dockerfile no encontrado: $dockerfile"
        $failCount++
        continue
    }
    
    try {
        # BUILD
        if (-not $SkipBuild) {
            Write-Info "Building $serviceName..."
            
            # Para web-front-end, usar target production
            if ($serviceName -eq "web-front-end") {
                docker build -t "${repoName}:$Tag" --target production $serviceDir
            }
            else {
                docker build -t "${repoName}:$Tag" $serviceDir
            }
            
            if ($LASTEXITCODE -ne 0) {
                throw "Docker build failed"
            }
            Write-Success "Build completado"
        }
        
        # TAG
        Write-Info "Tagging image..."
        docker tag "${repoName}:$Tag" $fullImageName
        Write-Success "Tag aplicado: $fullImageName"
        
        # PUSH
        if (-not $SkipPush) {
            Write-Info "Pushing to ECR..."
            docker push $fullImageName
            if ($LASTEXITCODE -ne 0) {
                throw "Docker push failed"
            }
            Write-Success "Push completado"
        }
        
        $successCount++
    }
    catch {
        Write-Err "Error procesando ${serviceName}: $_"
        $failCount++
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# RESUMEN
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "                         RESUMEN" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Success "Servicios exitosos: $successCount"
if ($failCount -gt 0) {
    Write-Err "Servicios fallidos: $failCount"
}
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
# ACTUALIZAR SERVICIOS ECS
# ─────────────────────────────────────────────────────────────────────────────
if ($successCount -gt 0 -and -not $SkipPush) {
    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "ACTUALIZANDO SERVICIOS ECS" -ForegroundColor White
    Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
    
    $ecsServices = @(
        "api-gateway",
        "auth-be",
        "prediagnostic-be",
        "notification-be",
        "message-producer",
        "web-frontend"
    )
    
    foreach ($svc in $ecsServices) {
        Write-Info "Forzando nuevo despliegue de $svc..."
        aws ecs update-service --cluster neumo-dev-cluster --service $svc --force-new-deployment --region $Region 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$svc actualizado"
        }
        else {
            Write-Warn "No se pudo actualizar $svc (puede que no exista aun)"
        }
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "            DESPLIEGUE COMPLETADO!" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Info "URL de la aplicacion:"
Write-Host "  http://neumo-dev-public-1899773425.us-east-1.elb.amazonaws.com" -ForegroundColor Yellow
Write-Host ""
