// Cliente GraphQL simple usando fetch API
// Conecta directamente al backend ya que CORS está habilitado
const GRAPHQL_URL = 'http://localhost:8080/query'; // URL CORRECTA!

export class GraphQLClient {
  static async query<T = any>(query: string, variables?: any): Promise<T> {
    console.log(`🚀 GraphQL Query iniciada...`);
    console.log(`🔗 URL: ${GRAPHQL_URL}`);
    console.log(`📝 Query:`, query);
    console.log(`📋 Variables:`, variables);
    
    try {
      const requestBody = {
        query,
        variables,
      };
      
      console.log(`📤 Enviando request:`, requestBody);
      
      // Obtener token JWT de las cookies para autenticación
      const token = typeof document !== 'undefined' 
        ? document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
        : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Agregar token JWT si está disponible
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`🔐 JWT Token agregado a headers`);
      } else {
        console.log(`⚠️ No JWT token found - request may fail for authenticated queries`);
      }

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        credentials: 'omit', // Sin credenciales para evitar problemas
        mode: 'cors', // Explícitamente CORS
      });

      console.log(`📥 Response status: ${response.status}`);
      console.log(`📥 Response OK: ${response.ok}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error: ${response.status}`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ GraphQL Response:`, result);

      if (result.errors) {
        console.error(`❌ GraphQL Errors:`, result.errors);
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }

      console.log(`🎯 Returning data:`, result.data);
      return result.data;
    } catch (error) {
      console.error('❌ GraphQL request failed:', error);
      
      // Si es un error de red, dar más detalles
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Error de conexión: ¿Está corriendo el backend en localhost:8080?');
      }
      
      throw error;
    }
  }
}
