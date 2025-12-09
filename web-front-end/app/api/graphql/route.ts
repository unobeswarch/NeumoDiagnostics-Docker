import { NextRequest, NextResponse } from 'next/server';

// Runtime proxy for GraphQL requests
// Uses SERVER_API_URL in AWS ECS, falls back to localhost for local dev
function getApiGatewayUrl(): string {
  return process.env.SERVER_API_URL || 'http://localhost:8080';
}

export async function POST(request: NextRequest) {
  const apiUrl = getApiGatewayUrl();
  // API Gateway uses /query for GraphQL queries, not /graphql
  const graphqlUrl = `${apiUrl}/query`;
  
  console.log(`[GraphQL Proxy] Forwarding POST request to: ${graphqlUrl}`);
  
  try {
    const body = await request.text();
    
    // Forward headers (including Authorization)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers,
      body,
    });
    
    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(`[GraphQL Proxy] Error proxying to ${graphqlUrl}:`, error);
    return NextResponse.json(
      { errors: [{ message: `Failed to reach API Gateway: ${error}` }] },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return the GraphQL playground for GET requests
  const apiUrl = getApiGatewayUrl();
  
  try {
    const response = await fetch(apiUrl);
    const html = await response.text();
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load GraphQL playground' },
      { status: 502 }
    );
  }
}
