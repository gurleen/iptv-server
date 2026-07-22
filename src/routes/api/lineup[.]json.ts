import { createFileRoute } from '@tanstack/react-router'

import { jsonOk } from '@/lib/api/response'
import { buildLineup } from '@/lib/lineup'

export const Route = createFileRoute('/api/lineup.json')({
  server: {
    handlers: {
      GET: async () => {
        const channels = buildLineup()
        return jsonOk({
          generatedAt: new Date().toISOString(),
          channelCount: channels.length,
          channels,
        })
      },
    },
  },
})
