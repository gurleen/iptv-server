import { createFileRoute } from '@tanstack/react-router'

import { jsonError, jsonOk } from '@/lib/api/response'
import { getProvider, listMergedChannels } from '@/lib/db'

export const Route = createFileRoute('/api/providers/$id/channels')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const provider = getProvider(params.id)
        if (!provider) {
          return jsonError('Provider not found', 404)
        }

        const channels = listMergedChannels(params.id)
        return jsonOk({ channels })
      },
    },
  },
})
