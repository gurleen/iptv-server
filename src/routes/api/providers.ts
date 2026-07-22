import { createFileRoute } from '@tanstack/react-router'

import { readJsonBody } from '@/lib/api/request'
import { jsonError, jsonOk } from '@/lib/api/response'
import {
  createProvider,
  getProvider,
  listProviders,
  sanitizeProvider,
} from '@/lib/db'
import type { CreateProviderInput } from '@/lib/db/types'
import { syncProviderChannels, XtreamError } from '@/lib/sync'
import { authenticate, normalizeServerUrl } from '@/lib/xtream/client'

export const Route = createFileRoute('/api/providers')({
  server: {
    handlers: {
      GET: async () => {
        const providers = listProviders().map(sanitizeProvider)
        return jsonOk({ providers })
      },
      POST: async ({ request }) => {
        const body = await readJsonBody<Partial<CreateProviderInput>>(request)
        if (body instanceof Response) {
          return body
        }

        const name = body.name?.trim()
        const serverUrl = body.serverUrl?.trim()
        const username = body.username?.trim()
        const password = body.password?.trim()

        if (!name || !serverUrl || !username || !password) {
          return jsonError(
            'name, serverUrl, username, and password are required',
            400,
          )
        }

        const normalizedUrl = normalizeServerUrl(serverUrl)

        try {
          await authenticate(normalizedUrl, username, password)
        } catch (error) {
          if (error instanceof XtreamError) {
            return jsonError(error.message, 400)
          }

          return jsonError('Failed to connect to Xtream provider', 502)
        }

        const provider = createProvider({
          name,
          serverUrl: normalizedUrl,
          username,
          password,
        })

        try {
          const channelCount = await syncProviderChannels(provider)
          return jsonOk(
            {
              provider: sanitizeProvider(getProvider(provider.id)!),
              channelCount,
            },
            { status: 201 },
          )
        } catch (error) {
          if (error instanceof XtreamError) {
            return jsonError(error.message, 502)
          }

          return jsonError('Provider saved but channel sync failed', 502)
        }
      },
    },
  },
})
