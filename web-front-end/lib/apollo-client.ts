// Cliente GraphQL simple usando fetch API
// Conecta al API Gateway a través de la URL configurada

// Use environment variable for API URL, fallback to localhost for development
const getGraphQLUrl = () => {
  // Client-side: use public env var
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/graphql`
      : 'http://localhost:8080/graphql';
  }
  // Server-side: use internal service URL or public URL
  return process.env.SERVER_API_URL 
    ? `${process.env.SERVER_API_URL}/graphql`
    : process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/graphql`
      : 'http://localhost:8080/graphql';
};

export class GraphQLClient {
  static async query<T = any>(query: string, variables?: any, token?: string): Promise<T> {
    const GRAPHQL_URL = getGraphQLUrl();
    
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
      
      const requestHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add JWT token if available
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
        console.log(`🔐 JWT Token agregado a headers`);
      } else {
        console.log(`⚠️ No JWT token found - request may fail for authenticated queries`);
      }

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        cache: 'no-store',
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
      
      // Network error details
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Error de conexión: ¿Está corriendo el backend?');
      }
      
      throw error;
    }
  }
}
