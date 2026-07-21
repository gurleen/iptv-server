import { createFileRoute } from '@tanstack/react-router'

import { jsonOk } from '@/lib/api/response'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () =>
        jsonOk({
          status: 'ok',
          service: 'iptv-server',
        }),
    },
  },
})
