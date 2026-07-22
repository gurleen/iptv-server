import { createFileRoute } from '@tanstack/react-router'

import { corsHeaders } from '@/lib/api/cors'
import { buildLineup, buildM3uPlaylist } from '@/lib/lineup'

export const Route = createFileRoute('/api/lineup.m3u')({
  server: {
    handlers: {
      GET: async () => {
        const channels = buildLineup()
        const body = buildM3uPlaylist(channels)

        return new Response(body, {
          headers: {
            'Content-Type': 'application/x-mpegURL; charset=utf-8',
            ...corsHeaders(),
          },
        })
      },
    },
  },
})
