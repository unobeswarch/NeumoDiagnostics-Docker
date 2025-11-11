#!/bin/bash

# Script to generate self-signed SSL certificates for local development
# This creates certificates for localhost that will work with the reverse proxy

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/../certs"

echo "🔐 Generating SSL Certificates for NeumoDiagnostics Reverse Proxy..."
echo ""

# Create certs directory if it doesn't exist
mkdir -p "$CERTS_DIR"

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out "$CERTS_DIR/localhost.key" 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key "$CERTS_DIR/localhost.key" \
    -out "$CERTS_DIR/localhost.csr" \
    -subj "/C=US/ST=State/L=City/O=NeumoDiagnostics/OU=Development/CN=localhost"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days 365 \
    -in "$CERTS_DIR/localhost.csr" \
    -signkey "$CERTS_DIR/localhost.key" \
    -out "$CERTS_DIR/localhost.crt" \
    -extfile <(printf "subjectAltName=DNS:localhost,DNS:*.localhost,DNS:app.localhost,DNS:api.localhost,IP:127.0.0.1")

# Clean up CSR file
rm "$CERTS_DIR/localhost.csr"

# Set proper permissions
chmod 644 "$CERTS_DIR/localhost.crt"
chmod 600 "$CERTS_DIR/localhost.key"

echo ""
echo "✅ SSL certificates generated successfully!"
echo ""
echo "📁 Certificate location: $CERTS_DIR"
echo "   - Certificate: localhost.crt"
echo "   - Private Key: localhost.key"
echo ""
echo "🚀 You can now start your Docker services:"
echo "   docker-compose up --build"
echo ""
echo "🌐 Access your application at:"
echo "   - https://localhost (or https://app.localhost)"
echo "   - https://api.localhost"
echo ""
echo "⚠️  Browser Warning:"
echo "   Your browser will show a security warning because this is a self-signed certificate."
echo "   You can safely proceed by clicking 'Advanced' and 'Proceed to localhost'."
echo ""
echo "💡 To avoid warnings, you can add the certificate to your system's trusted certificates:"
echo "   - macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERTS_DIR/localhost.crt"
echo "   - Linux: sudo cp $CERTS_DIR/localhost.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
echo ""
