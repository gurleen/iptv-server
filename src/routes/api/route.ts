import { createFileRoute } from '@tanstack/react-router'

import { corsMiddleware } from '@/lib/api/cors'

export const Route = createFileRoute('/api')({
  server: {
    middleware: [corsMiddleware],
  },
})
