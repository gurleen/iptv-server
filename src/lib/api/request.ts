import { jsonError } from '@/lib/api/response'

export async function readJsonBody<T>(request: Request): Promise<T | Response> {
  try {
    return (await request.json()) as T
  } catch {
    return jsonError('Invalid JSON body', 400)
  }
}

export function parseStreamId(value: string): number | Response {
  const streamId = Number.parseInt(value, 10)
  if (!Number.isFinite(streamId)) {
    return jsonError('Invalid stream id', 400)
  }

  return streamId
}
