@echo off
REM Script to generate self-signed SSL certificates for local development (Windows)
REM Requires OpenSSL to be installed and in PATH

setlocal

set SCRIPT_DIR=%~dp0
set CERTS_DIR=%SCRIPT_DIR%..\certs

echo 🔐 Generating SSL Certificates for NeumoDiagnostics Reverse Proxy...
echo.

REM Create certs directory if it doesn't exist
if not exist "%CERTS_DIR%" mkdir "%CERTS_DIR%"

REM Generate private key
echo 📝 Generating private key...
openssl genrsa -out "%CERTS_DIR%\localhost.key" 2048

REM Generate certificate signing request
echo 📝 Generating certificate signing request...
openssl req -new -key "%CERTS_DIR%\localhost.key" -out "%CERTS_DIR%\localhost.csr" -subj "/C=US/ST=State/L=City/O=NeumoDiagnostics/OU=Development/CN=localhost"

REM Create config file for SAN
echo [req] > "%CERTS_DIR%\san.cnf"
echo distinguished_name = req_distinguished_name >> "%CERTS_DIR%\san.cnf"
echo [v3_req] >> "%CERTS_DIR%\san.cnf"
echo subjectAltName = @alt_names >> "%CERTS_DIR%\san.cnf"
echo [alt_names] >> "%CERTS_DIR%\san.cnf"
echo DNS.1 = localhost >> "%CERTS_DIR%\san.cnf"
echo DNS.2 = *.localhost >> "%CERTS_DIR%\san.cnf"
echo DNS.3 = app.localhost >> "%CERTS_DIR%\san.cnf"
echo DNS.4 = api.localhost >> "%CERTS_DIR%\san.cnf"
echo IP.1 = 127.0.0.1 >> "%CERTS_DIR%\san.cnf"

REM Generate self-signed certificate
echo 📝 Generating self-signed certificate...
openssl x509 -req -days 365 -in "%CERTS_DIR%\localhost.csr" -signkey "%CERTS_DIR%\localhost.key" -out "%CERTS_DIR%\localhost.crt" -extensions v3_req -extfile "%CERTS_DIR%\san.cnf"

REM Clean up temporary files
del "%CERTS_DIR%\localhost.csr"
del "%CERTS_DIR%\san.cnf"

echo.
echo ✅ SSL certificates generated successfully!
echo.
echo 📁 Certificate location: %CERTS_DIR%
echo    - Certificate: localhost.crt
echo    - Private Key: localhost.key
echo.
echo 🚀 You can now start your Docker services:
echo    docker-compose up --build
echo.
echo 🌐 Access your application at:
echo    - https://localhost (or https://app.localhost)
echo    - https://api.localhost
echo.
echo ⚠️  Browser Warning:
echo    Your browser will show a security warning because this is a self-signed certificate.
echo    You can safely proceed by clicking 'Advanced' and 'Proceed to localhost'.
echo.
echo 💡 To avoid warnings on Windows:
echo    1. Double-click on localhost.crt
echo    2. Click 'Install Certificate'
echo    3. Select 'Local Machine'
echo    4. Choose 'Place all certificates in the following store'
echo    5. Browse and select 'Trusted Root Certification Authorities'
echo    6. Complete the wizard
echo.

pause
