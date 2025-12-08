#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# NEUMODIAGNOSTICS - DEPLOY IMAGES TO ECR
# ═══════════════════════════════════════════════════════════════════════════════
# Script para construir y subir todas las imágenes Docker a AWS ECR
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Configuración
REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-566115828526}"
TAG="${IMAGE_TAG:-latest}"
ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Colores
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}       NEUMODIAGNOSTICS - DEPLOY TO AWS ECR${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}ℹ️  Registry: $ECR_REGISTRY${NC}"
echo -e "${CYAN}ℹ️  Tag: $TAG${NC}"
echo -e "${CYAN}ℹ️  Project Root: $PROJECT_ROOT${NC}"
echo ""

# Servicios a desplegar
declare -A SERVICES=(
    ["api-gateway"]="neumo/api-gateway"
    ["auth-be"]="neumo/auth-be"
    ["prediagnostic-be"]="neumo/prediagnostic-be"
    ["notification-be"]="neumo/notification-be"
    ["message-producer"]="neumo/message-producer"
    ["web-front-end"]="neumo/web-frontend"
)

# ─────────────────────────────────────────────────────────────────────────────
# PASO 1: LOGIN A ECR
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${NC}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "PASO 1: Autenticación en ECR"
echo -e "${NC}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${CYAN}ℹ️  Obteniendo token de ECR...${NC}"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
echo -e "${GREEN}✅ Login exitoso en ECR${NC}"

# ─────────────────────────────────────────────────────────────────────────────
# PASO 2: BUILD Y PUSH DE CADA SERVICIO
# ─────────────────────────────────────────────────────────────────────────────
SUCCESS_COUNT=0
FAIL_COUNT=0

for SERVICE_NAME in "${!SERVICES[@]}"; do
    REPO_NAME="${SERVICES[$SERVICE_NAME]}"
    SERVICE_DIR="$PROJECT_ROOT/$SERVICE_NAME"
    FULL_IMAGE_NAME="$ECR_REGISTRY/$REPO_NAME:$TAG"
    
    echo ""
    echo -e "${NC}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "SERVICIO: $SERVICE_NAME"
    echo -e "${NC}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Verificar directorio y Dockerfile
    if [ ! -d "$SERVICE_DIR" ]; then
        echo -e "${YELLOW}⚠️  Directorio no encontrado: $SERVICE_DIR${NC}"
        ((FAIL_COUNT++))
        continue
    fi
    
    if [ ! -f "$SERVICE_DIR/Dockerfile" ]; then
        echo -e "${YELLOW}⚠️  Dockerfile no encontrado${NC}"
        ((FAIL_COUNT++))
        continue
    fi
    
    # BUILD
    echo -e "${CYAN}ℹ️  Building $SERVICE_NAME...${NC}"
    if [ "$SERVICE_NAME" == "web-front-end" ]; then
        docker build -t "$REPO_NAME:$TAG" --target production "$SERVICE_DIR"
    else
        docker build -t "$REPO_NAME:$TAG" "$SERVICE_DIR"
    fi
    echo -e "${GREEN}✅ Build completado${NC}"
    
    # TAG
    echo -e "${CYAN}ℹ️  Tagging image...${NC}"
    docker tag "$REPO_NAME:$TAG" "$FULL_IMAGE_NAME"
    echo -e "${GREEN}✅ Tag aplicado: $FULL_IMAGE_NAME${NC}"
    
    # PUSH
    echo -e "${CYAN}ℹ️  Pushing to ECR...${NC}"
    docker push "$FULL_IMAGE_NAME"
    echo -e "${GREEN}✅ Push completado${NC}"
    
    ((SUCCESS_COUNT++))
done

# ─────────────────────────────────────────────────────────────────────────────
# RESUMEN
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}                         RESUMEN${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Servicios exitosos: $SUCCESS_COUNT${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}❌ Servicios fallidos: $FAIL_COUNT${NC}"
fi

# ─────────────────────────────────────────────────────────────────────────────
# ACTUALIZAR SERVICIOS ECS
# ─────────────────────────────────────────────────────────────────────────────
if [ $SUCCESS_COUNT -gt 0 ]; then
    echo ""
    echo -e "${NC}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "ACTUALIZANDO SERVICIOS ECS"
    echo -e "${NC}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    ECS_SERVICES=("api-gateway" "auth-be" "prediagnostic-be" "notification-be" "message-producer" "web-frontend")
    
    for SVC in "${ECS_SERVICES[@]}"; do
        echo -e "${CYAN}ℹ️  Forzando nuevo despliegue de $SVC...${NC}"
        if aws ecs update-service --cluster neumo-dev-cluster --service "$SVC" --force-new-deployment --region $REGION > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $SVC actualizado${NC}"
        else
            echo -e "${YELLOW}⚠️  No se pudo actualizar $SVC${NC}"
        fi
    done
fi

echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}                    ¡DESPLIEGUE COMPLETADO!${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}ℹ️  URL de la aplicación:${NC}"
echo -e "${YELLOW}  http://neumo-dev-public-1899773425.us-east-1.elb.amazonaws.com${NC}"
echo ""

