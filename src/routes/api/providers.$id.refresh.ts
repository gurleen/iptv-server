import { createFileRoute } from '@tanstack/react-router'

import { jsonError, jsonOk } from '@/lib/api/response'
import { getProvider, sanitizeProvider } from '@/lib/db'
import { syncProviderChannels, XtreamError } from '@/lib/sync'

export const Route = createFileRoute('/api/providers/$id/refresh')({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const provider = getProvider(params.id)
        if (!provider) {
          return jsonError('Provider not found', 404)
        }

        try {
          const channelCount = await syncProviderChannels(provider)
          const updated = getProvider(params.id)!

          return jsonOk({
            provider: sanitizeProvider(updated),
            channelCount,
          })
        } catch (error) {
          if (error instanceof XtreamError) {
            return jsonError(error.message, 502)
          }

          return jsonError('Failed to refresh provider channels', 502)
        }
      },
    },
  },
})
