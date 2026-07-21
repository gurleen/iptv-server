import { corsHeaders } from '@/lib/api/cors'

export type ApiErrorBody = {
  error: string
  details?: unknown
}

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  applyCorsHeaders(headers)

  return Response.json(data, {
    ...init,
    headers,
  })
}

export function jsonError(
  message: string,
  status = 400,
  details?: unknown,
): Response {
  const body: ApiErrorBody = { error: message }
  if (details !== undefined) {
    body.details = details
  }

  return jsonOk(body, { status })
}

function applyCorsHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value)
  }
}
