#!/bin/bash

# Script to generate self-signed SSL certificates for local development
# Usage: ./scripts/generate-certs.sh

set -e

CERTS_DIR="./certs"
DOMAIN="localhost"
DAYS_VALID=825  # Maximum validity for self-signed certs in modern browsers
COUNTRY="CO"
STATE="Bogota"
CITY="Bogota"
ORGANIZATION="NeumoDiagnostics"
ORG_UNIT="Development"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Generating SSL Certificates for NeumoDiagnostics${NC}"
echo "=================================================="

# Create certs directory if it doesn't exist
if [ ! -d "$CERTS_DIR" ]; then
    mkdir -p "$CERTS_DIR"
    echo -e "${GREEN}✓${NC} Created $CERTS_DIR directory"
else
    echo -e "${YELLOW}⚠${NC}  $CERTS_DIR directory already exists"
fi

# Step 1: Generate Root CA private key
echo ""
echo -e "${GREEN}Step 1:${NC} Generating Root CA private key..."
if [ ! -f "$CERTS_DIR/rootCA.key" ]; then
    openssl genrsa -out "$CERTS_DIR/rootCA.key" 4096
    echo -e "${GREEN}✓${NC} Root CA key created: $CERTS_DIR/rootCA.key"
else
    echo -e "${YELLOW}⚠${NC}  Root CA key already exists, skipping..."
fi

# Step 2: Generate Root CA certificate
echo ""
echo -e "${GREEN}Step 2:${NC} Generating Root CA certificate..."
if [ ! -f "$CERTS_DIR/rootCA.pem" ]; then
    openssl req -x509 -new -nodes \
        -key "$CERTS_DIR/rootCA.key" \
        -sha256 -days 1024 \
        -out "$CERTS_DIR/rootCA.pem" \
        -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORG_UNIT/CN=$ORGANIZATION Root CA"
    echo -e "${GREEN}✓${NC} Root CA certificate created: $CERTS_DIR/rootCA.pem"
else
    echo -e "${YELLOW}⚠${NC}  Root CA certificate already exists, skipping..."
fi

# Step 3: Generate server private key
echo ""
echo -e "${GREEN}Step 3:${NC} Generating server private key..."
if [ ! -f "$CERTS_DIR/localhost.key" ]; then
    openssl genrsa -out "$CERTS_DIR/localhost.key" 2048
    echo -e "${GREEN}✓${NC} Server key created: $CERTS_DIR/localhost.key"
else
    echo -e "${YELLOW}⚠${NC}  Server key already exists, skipping..."
fi

# Step 4: Generate Certificate Signing Request (CSR)
echo ""
echo -e "${GREEN}Step 4:${NC} Generating Certificate Signing Request (CSR)..."
if [ ! -f "$CERTS_DIR/localhost.csr" ]; then
    openssl req -new \
        -key "$CERTS_DIR/localhost.key" \
        -out "$CERTS_DIR/localhost.csr" \
        -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORG_UNIT/CN=$DOMAIN"
    echo -e "${GREEN}✓${NC} CSR created: $CERTS_DIR/localhost.csr"
else
    echo -e "${YELLOW}⚠${NC}  CSR already exists, skipping..."
fi

# Step 5: Create v3 extensions file with SAN
echo ""
echo -e "${GREEN}Step 5:${NC} Creating v3 extensions configuration..."
cat > "$CERTS_DIR/v3.ext" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = web-front-end
DNS.3 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
echo -e "${GREEN}✓${NC} v3 extensions file created: $CERTS_DIR/v3.ext"

# Step 6: Sign the certificate
echo ""
echo -e "${GREEN}Step 6:${NC} Signing the server certificate..."
if [ ! -f "$CERTS_DIR/localhost.crt" ]; then
    openssl x509 -req \
        -in "$CERTS_DIR/localhost.csr" \
        -CA "$CERTS_DIR/rootCA.pem" \
        -CAkey "$CERTS_DIR/rootCA.key" \
        -CAcreateserial \
        -out "$CERTS_DIR/localhost.crt" \
        -days $DAYS_VALID \
        -sha256 \
        -extfile "$CERTS_DIR/v3.ext"
    echo -e "${GREEN}✓${NC} Server certificate created: $CERTS_DIR/localhost.crt"
else
    echo -e "${YELLOW}⚠${NC}  Server certificate already exists, skipping..."
fi

# Set appropriate permissions
chmod 600 "$CERTS_DIR"/*.key
chmod 644 "$CERTS_DIR"/*.crt "$CERTS_DIR"/*.pem

echo ""
echo -e "${GREEN}=================================================="
echo -e "✅ Certificate Generation Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Trust the Root CA certificate in your system/browser:"
echo "   - macOS:   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERTS_DIR/rootCA.pem"
echo "   - Windows: Import $CERTS_DIR/rootCA.pem into 'Trusted Root Certification Authorities'"
echo "   - Linux:   sudo cp $CERTS_DIR/rootCA.pem /usr/local/share/ca-certificates/neumodiagnostics-root-ca.crt && sudo update-ca-certificates"
echo ""
echo "2. Start the HTTPS server:"
echo "   npm run dev:https"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Never commit certificate files to git!${NC}"
echo -e "${RED}   These certificates are for LOCAL DEVELOPMENT ONLY${NC}"
echo ""

