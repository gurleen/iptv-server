import { createFileRoute } from '@tanstack/react-router'

import { readJsonBody } from '@/lib/api/request'
import { jsonError, jsonOk } from '@/lib/api/response'
import {
  deleteProvider,
  getProvider,
  sanitizeProvider,
  updateProvider,
} from '@/lib/db'
import type { UpdateProviderInput } from '@/lib/db/types'
import { authenticate, normalizeServerUrl } from '@/lib/xtream/client'
import { XtreamError } from '@/lib/sync'

export const Route = createFileRoute('/api/providers/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const provider = getProvider(params.id)
        if (!provider) {
          return jsonError('Provider not found', 404)
        }

        return jsonOk({ provider: sanitizeProvider(provider) })
      },
      PATCH: async ({ params, request }) => {
        const existing = getProvider(params.id)
        if (!existing) {
          return jsonError('Provider not found', 404)
        }

        const body = await readJsonBody<UpdateProviderInput>(request)
        if (body instanceof Response) {
          return body
        }

        const nextServerUrl = body.serverUrl
          ? normalizeServerUrl(body.serverUrl)
          : existing.serverUrl
        const nextUsername = body.username?.trim() ?? existing.username
        const nextPassword = body.password?.trim() ?? existing.password

        const credentialsChanged =
          nextServerUrl !== existing.serverUrl ||
          nextUsername !== existing.username ||
          nextPassword !== existing.password

        if (credentialsChanged) {
          try {
            await authenticate(nextServerUrl, nextUsername, nextPassword)
          } catch (error) {
            if (error instanceof XtreamError) {
              return jsonError(error.message, 400)
            }

            return jsonError('Failed to connect to Xtream provider', 502)
          }
        }

        const provider = updateProvider(params.id, {
          name: body.name?.trim(),
          serverUrl: nextServerUrl,
          username: nextUsername,
          password: nextPassword,
        })

        return jsonOk({ provider: sanitizeProvider(provider!) })
      },
      DELETE: async ({ params }) => {
        const deleted = deleteProvider(params.id)
        if (!deleted) {
          return jsonError('Provider not found', 404)
        }

        return new Response(null, { status: 204 })
      },
    },
  },
})
