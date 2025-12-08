/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Configuración para permitir conexiones al backend en desarrollo
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: 'http://localhost:8080/graphql',
      },
    ];
  },
  // Configuración adicional para desarrollo
  experimental: {
    serverComponentsExternalPackages: ['@apollo/client'],
  },
};

export default nextConfig;
