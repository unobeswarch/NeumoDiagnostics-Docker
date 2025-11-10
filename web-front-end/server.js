/**
 * Custom HTTPS Server for Next.js
 * 
 * This server enables HTTPS for local development using self-signed certificates.
 * 
 * Usage:
 *   Development: NODE_ENV=development node server.js
 *   Production:  NODE_ENV=production node server.js
 */

const { createServer: createHttpsServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const httpsPort = parseInt(process.env.HTTPS_PORT || '3443', 10);
const httpPort = parseInt(process.env.HTTP_PORT || '3000', 10);
const useHttps = process.env.USE_HTTPS === 'true' || dev;

// Certificate paths
const certsDir = path.join(__dirname, 'certs');
const certFiles = {
  key: path.join(certsDir, 'localhost.key'),
  cert: path.join(certsDir, 'localhost.crt'),
};

// Initialize Next.js app
const app = next({ dev, hostname, port: httpsPort });
const handle = app.getRequestHandler();

/**
 * Check if SSL certificates exist
 */
function checkCertificates() {
  const missingFiles = [];
  
  if (!fs.existsSync(certFiles.key)) {
    missingFiles.push(certFiles.key);
  }
  if (!fs.existsSync(certFiles.cert)) {
    missingFiles.push(certFiles.cert);
  }
  
  if (missingFiles.length > 0) {
    console.error('\n❌ SSL Certificate files not found:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    console.error('\n📝 Please generate certificates first:');
    console.error('   - Linux/Mac: ./scripts/generate-certs.sh');
    console.error('   - Windows:   scripts\\generate-certs.bat\n');
    process.exit(1);
  }
  
  return true;
}

/**
 * Create HTTPS options
 */
function getHttpsOptions() {
  try {
    return {
      key: fs.readFileSync(certFiles.key),
      cert: fs.readFileSync(certFiles.cert),
    };
  } catch (error) {
    console.error('❌ Error reading certificate files:', error.message);
    process.exit(1);
  }
}

/**
 * HTTP to HTTPS redirect server
 */
function createRedirectServer() {
  return createHttpServer((req, res) => {
    const host = req.headers.host?.split(':')[0] || hostname;
    const redirectUrl = `https://${host}:${httpsPort}${req.url}`;
    
    res.writeHead(301, { Location: redirectUrl });
    res.end();
  });
}

/**
 * Request handler for both HTTP and HTTPS
 */
function requestHandler(req, res) {
  try {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  } catch (err) {
    console.error('❌ Error handling request:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

/**
 * Start the server
 */
async function startServer() {
  try {
    console.log('🚀 Starting NeumoDiagnostics Web Server...\n');
    
    // Prepare Next.js app
    await app.prepare();
    console.log('✅ Next.js app prepared\n');
    
    if (useHttps) {
      // Check certificates exist
      checkCertificates();
      
      // Create HTTPS server
      const httpsOptions = getHttpsOptions();
      const httpsServer = createHttpsServer(httpsOptions, requestHandler);
      
      httpsServer.listen(httpsPort, hostname, (err) => {
        if (err) throw err;
        
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ HTTPS Server ready!');
        console.log('═══════════════════════════════════════════════════');
        console.log(`🔒 HTTPS: https://${hostname}:${httpsPort}`);
        console.log(`📦 Environment: ${dev ? 'development' : 'production'}`);
        console.log(`📅 Started: ${new Date().toLocaleString()}`);
        console.log('═══════════════════════════════════════════════════\n');
        
        if (dev) {
          console.log('💡 Tips:');
          console.log('   - Trust the Root CA certificate to avoid browser warnings');
          console.log('   - Check scripts/generate-certs.sh for instructions');
          console.log('');
        }
      });
      
      // Optionally create HTTP redirect server (only in development)
      if (dev) {
        const redirectServer = createRedirectServer();
        redirectServer.listen(httpPort, hostname, (err) => {
          if (err) {
            console.warn('⚠️  Warning: Could not start HTTP redirect server:', err.message);
          } else {
            console.log(`🔀 HTTP → HTTPS redirect: http://${hostname}:${httpPort} → https://${hostname}:${httpsPort}\n`);
          }
        });
      }
      
      // Handle graceful shutdown
      process.on('SIGTERM', () => {
        console.log('\n⏹️  SIGTERM received, shutting down gracefully...');
        httpsServer.close(() => {
          console.log('✅ HTTPS server closed');
          process.exit(0);
        });
      });
      
      process.on('SIGINT', () => {
        console.log('\n⏹️  SIGINT received, shutting down gracefully...');
        httpsServer.close(() => {
          console.log('✅ HTTPS server closed');
          process.exit(0);
        });
      });
      
    } else {
      // HTTP-only mode (production with reverse proxy)
      const httpServer = createHttpServer(requestHandler);
      
      httpServer.listen(httpPort, hostname, (err) => {
        if (err) throw err;
        
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ HTTP Server ready!');
        console.log('═══════════════════════════════════════════════════');
        console.log(`🌐 HTTP: http://${hostname}:${httpPort}`);
        console.log(`📦 Environment: ${dev ? 'development' : 'production'}`);
        console.log('═══════════════════════════════════════════════════\n');
      });
      
      // Handle graceful shutdown
      process.on('SIGTERM', () => {
        console.log('\n⏹️  SIGTERM received, shutting down gracefully...');
        httpServer.close(() => {
          console.log('✅ HTTP server closed');
          process.exit(0);
        });
      });
    }
    
  } catch (err) {
    console.error('❌ Fatal error starting server:', err);
    process.exit(1);
  }
}

// Start the server
startServer();

