import { createFileRoute } from '@tanstack/react-router'

import { corsHeaders } from '@/lib/api/cors'
import { listProviders } from '@/lib/db'
import { buildEpgUrl } from '@/lib/xtream/client'

export const Route = createFileRoute('/api/epg.xml')({
  server: {
    handlers: {
      GET: async () => {
        const providers = listProviders()

        if (providers.length === 0) {
          return new Response(
            '<?xml version="1.0" encoding="UTF-8"?><tv></tv>',
            {
              headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                ...corsHeaders(),
              },
            },
          )
        }

        const chunks = await Promise.all(
          providers.map(async (provider) => {
            const response = await fetch(
              buildEpgUrl(
                provider.serverUrl,
                provider.username,
                provider.password,
              ),
            )

            if (!response.ok) {
              return ''
            }

            const xml = await response.text()
            return xml.replace(/^<\?xml[^>]*>\s*/i, '')
          }),
        )

        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<tv>\n${chunks.join('\n')}\n</tv>`

        return new Response(body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            ...corsHeaders(),
          },
        })
      },
    },
  },
})
