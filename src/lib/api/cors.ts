import { createMiddleware } from '@tanstack/react-start'

export function getCorsOrigin(): string {
  return process.env.CORS_ORIGIN ?? '*'
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export function withCors(response: Response): Response {
  const headers = new Headers(response.headers)

  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const corsMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  const result = await next()

  if (result.response instanceof Response) {
    return {
      ...result,
      response: withCors(result.response),
    }
  }

  return result
})
