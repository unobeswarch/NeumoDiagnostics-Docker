@echo off
REM Script to generate self-signed SSL certificates for local development (Windows)
REM Usage: scripts\generate-certs.bat

setlocal EnableDelayedExpansion

set CERTS_DIR=certs
set DOMAIN=localhost
set DAYS_VALID=825
set COUNTRY=CO
set STATE=Bogota
set CITY=Bogota
set ORGANIZATION=NeumoDiagnostics
set ORG_UNIT=Development

echo ============================================
echo 🔐 Generating SSL Certificates for NeumoDiagnostics
echo ============================================
echo.

REM Create certs directory if it doesn't exist
if not exist "%CERTS_DIR%" (
    mkdir "%CERTS_DIR%"
    echo [✓] Created %CERTS_DIR% directory
) else (
    echo [⚠] %CERTS_DIR% directory already exists
)

REM Step 1: Generate Root CA private key
echo.
echo Step 1: Generating Root CA private key...
if not exist "%CERTS_DIR%\rootCA.key" (
    openssl genrsa -out "%CERTS_DIR%\rootCA.key" 4096
    if errorlevel 1 (
        echo [✗] Failed to generate Root CA key
        exit /b 1
    )
    echo [✓] Root CA key created: %CERTS_DIR%\rootCA.key
) else (
    echo [⚠] Root CA key already exists, skipping...
)

REM Step 2: Generate Root CA certificate
echo.
echo Step 2: Generating Root CA certificate...
if not exist "%CERTS_DIR%\rootCA.pem" (
    openssl req -x509 -new -nodes -key "%CERTS_DIR%\rootCA.key" -sha256 -days 1024 -out "%CERTS_DIR%\rootCA.pem" -subj "/C=%COUNTRY%/ST=%STATE%/L=%CITY%/O=%ORGANIZATION%/OU=%ORG_UNIT%/CN=%ORGANIZATION% Root CA"
    if errorlevel 1 (
        echo [✗] Failed to generate Root CA certificate
        exit /b 1
    )
    echo [✓] Root CA certificate created: %CERTS_DIR%\rootCA.pem
) else (
    echo [⚠] Root CA certificate already exists, skipping...
)

REM Step 3: Generate server private key
echo.
echo Step 3: Generating server private key...
if not exist "%CERTS_DIR%\localhost.key" (
    openssl genrsa -out "%CERTS_DIR%\localhost.key" 2048
    if errorlevel 1 (
        echo [✗] Failed to generate server key
        exit /b 1
    )
    echo [✓] Server key created: %CERTS_DIR%\localhost.key
) else (
    echo [⚠] Server key already exists, skipping...
)

REM Step 4: Generate Certificate Signing Request (CSR)
echo.
echo Step 4: Generating Certificate Signing Request (CSR)...
if not exist "%CERTS_DIR%\localhost.csr" (
    openssl req -new -key "%CERTS_DIR%\localhost.key" -out "%CERTS_DIR%\localhost.csr" -subj "/C=%COUNTRY%/ST=%STATE%/L=%CITY%/O=%ORGANIZATION%/OU=%ORG_UNIT%/CN=%DOMAIN%"
    if errorlevel 1 (
        echo [✗] Failed to generate CSR
        exit /b 1
    )
    echo [✓] CSR created: %CERTS_DIR%\localhost.csr
) else (
    echo [⚠] CSR already exists, skipping...
)

REM Step 5: Create v3 extensions file
echo.
echo Step 5: Creating v3 extensions configuration...
(
echo authorityKeyIdentifier=keyid,issuer
echo basicConstraints=CA:FALSE
echo keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = localhost
echo DNS.2 = web-front-end
echo DNS.3 = *.localhost
echo IP.1 = 127.0.0.1
echo IP.2 = ::1
) > "%CERTS_DIR%\v3.ext"
echo [✓] v3 extensions file created: %CERTS_DIR%\v3.ext

REM Step 6: Sign the certificate
echo.
echo Step 6: Signing the server certificate...
if not exist "%CERTS_DIR%\localhost.crt" (
    openssl x509 -req -in "%CERTS_DIR%\localhost.csr" -CA "%CERTS_DIR%\rootCA.pem" -CAkey "%CERTS_DIR%\rootCA.key" -CAcreateserial -out "%CERTS_DIR%\localhost.crt" -days %DAYS_VALID% -sha256 -extfile "%CERTS_DIR%\v3.ext"
    if errorlevel 1 (
        echo [✗] Failed to sign certificate
        exit /b 1
    )
    echo [✓] Server certificate created: %CERTS_DIR%\localhost.crt
) else (
    echo [⚠] Server certificate already exists, skipping...
)

echo.
echo ============================================
echo ✅ Certificate Generation Complete!
echo ============================================
echo.
echo 📋 Next Steps:
echo 1. Trust the Root CA certificate in Windows:
echo    - Press Win+R, type 'certmgr.msc', press Enter
echo    - Right-click 'Trusted Root Certification Authorities' ^> 'All Tasks' ^> 'Import'
echo    - Select %CERTS_DIR%\rootCA.pem
echo    - Complete the wizard
echo.
echo 2. Or use PowerShell (Run as Administrator):
echo    Import-Certificate -FilePath "%CD%\%CERTS_DIR%\rootCA.pem" -CertStoreLocation Cert:\LocalMachine\Root
echo.
echo 3. Start the HTTPS server:
echo    npm run dev:https
echo.
echo ⚠️  IMPORTANT: Never commit certificate files to git!
echo    These certificates are for LOCAL DEVELOPMENT ONLY
echo.

endlocal

