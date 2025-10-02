/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para permitir conexiones al backend en desarrollo
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: 'http://business-logic-be:8080/graphql',
      },
    ];
  },
  // Configuración adicional para desarrollo
  experimental: {
    serverComponentsExternalPackages: ['@apollo/client'],
  },
};

export default nextConfig;
