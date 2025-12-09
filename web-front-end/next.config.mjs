/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Note: GraphQL proxy is handled by /app/api/graphql/route.ts at runtime
  // This allows SERVER_API_URL to be read at runtime instead of build time
  
  // Configuración adicional para desarrollo
  experimental: {
    serverComponentsExternalPackages: ['@apollo/client'],
  },
};

export default nextConfig;
