import { createFileRoute } from '@tanstack/react-router'

import { parseStreamId, readJsonBody } from '@/lib/api/request'
import { jsonError, jsonOk } from '@/lib/api/response'
import {
  deleteChannelOverride,
  getProvider,
  upsertChannelOverride,
} from '@/lib/db'
import type { UpsertChannelOverrideInput } from '@/lib/db/types'

export const Route = createFileRoute(
  '/api/providers/$id/channels/$streamId',
)({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const provider = getProvider(params.id)
        if (!provider) {
          return jsonError('Provider not found', 404)
        }

        const streamId = parseStreamId(params.streamId)
        if (streamId instanceof Response) {
          return streamId
        }

        const body = await readJsonBody<UpsertChannelOverrideInput>(request)
        if (body instanceof Response) {
          return body
        }

        const channel = upsertChannelOverride(params.id, streamId, body)
        if (!channel) {
          return jsonError('Channel not found', 404)
        }

        return jsonOk({ channel })
      },
      DELETE: async ({ params }) => {
        const provider = getProvider(params.id)
        if (!provider) {
          return jsonError('Provider not found', 404)
        }

        const streamId = parseStreamId(params.streamId)
        if (streamId instanceof Response) {
          return streamId
        }

        const deleted = deleteChannelOverride(params.id, streamId)
        if (!deleted) {
          return jsonError('Channel override not found', 404)
        }

        return new Response(null, { status: 204 })
      },
    },
  },
})
