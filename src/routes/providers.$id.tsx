import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ProviderSummary = {
  id: string
  name: string
  serverUrl: string
  username: string
  createdAt: string
  lastSyncedAt: string | null
}

type ChannelRow = {
  providerId: string
  streamId: number
  num: number
  name: string
  streamIcon: string | null
  epgChannelId: string | null
  categoryId: string | null
  categoryName: string | null
  tvArchive: number
  customName: string | null
  customEpgId: string | null
  customIcon: string | null
  customCategory: string | null
  enabled: boolean
  sortOrder: number | null
  displayName: string
  displayEpgId: string | null
  displayIcon: string | null
  displayCategory: string | null
}

export const Route = createFileRoute('/providers/$id')({
  component: ProviderDetail,
})

function ProviderDetail() {
  const { id } = Route.useParams()
  const [provider, setProvider] = useState<ProviderSummary | null>(null)
  const [channels, setChannels] = useState<ChannelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  async function loadData() {
    setLoading(true)
    setError(null)

    const [providerResponse, channelsResponse] = await Promise.all([
      fetch(`/api/providers/${id}`),
      fetch(`/api/providers/${id}/channels`),
    ])

    if (!providerResponse.ok) {
      setError('Provider not found')
      setLoading(false)
      return
    }

    const providerData = (await providerResponse.json()) as {
      provider: ProviderSummary
    }
    const channelsData = (await channelsResponse.json()) as {
      channels: ChannelRow[]
    }

    setProvider(providerData.provider)
    setChannels(channelsData.channels)
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [id])

  async function refreshChannels() {
    setRefreshing(true)
    setError(null)

    try {
      const response = await fetch(`/api/providers/${id}/refresh`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to refresh channels')
      }

      await loadData()
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'Failed to refresh channels',
      )
    } finally {
      setRefreshing(false)
    }
  }

  async function updateChannel(
    streamId: number,
    patch: Partial<{
      customName: string | null
      customEpgId: string | null
      customCategory: string | null
      enabled: boolean
      sortOrder: number | null
    }>,
  ) {
    const response = await fetch(`/api/providers/${id}/channels/${streamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })

    if (!response.ok) {
      const data = await response.json()
      setError(data.error ?? 'Failed to update channel')
      return
    }

    const data = (await response.json()) as { channel: ChannelRow }
    setChannels((current) =>
      current.map((channel) =>
        channel.streamId === streamId ? data.channel : channel,
      ),
    )
  }

  const filteredChannels = channels.filter((channel) => {
    const query = filter.trim().toLowerCase()
    if (!query) {
      return true
    }

    return (
      channel.displayName.toLowerCase().includes(query) ||
      (channel.displayCategory?.toLowerCase().includes(query) ?? false) ||
      (channel.displayEpgId?.toLowerCase().includes(query) ?? false)
    )
  })

  if (loading) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-7xl items-center justify-center p-6">
        <p className="text-muted-foreground">Loading provider…</p>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive">{error ?? 'Provider not found'}</p>
        <Button asChild variant="outline">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="px-0">
            <Link to="/">← Back</Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {provider.name}
            </h1>
            <Badge variant="secondary">{channels.length} channels</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{provider.serverUrl}</p>
        </div>
        <Button onClick={() => void refreshChannels()} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh channels'}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Channel overrides</CardTitle>
          <CardDescription>
            Customize display names, EPG IDs, categories, visibility, and sort
            order. Changes are reflected in the JSON lineup output.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filter channels…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enabled</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Display name</TableHead>
                  <TableHead>EPG ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sort</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.map((channel) => (
                  <TableRow key={channel.streamId}>
                    <TableCell>
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={(enabled) =>
                          void updateChannel(channel.streamId, { enabled })
                        }
                      />
                    </TableCell>
                    <TableCell>{channel.num}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {channel.categoryName ?? 'Uncategorized'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={channel.customName ?? ''}
                        placeholder={channel.name}
                        onBlur={(event) => {
                          const value = event.target.value.trim()
                          void updateChannel(channel.streamId, {
                            customName: value || null,
                          })
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={channel.customEpgId ?? ''}
                        placeholder={channel.epgChannelId ?? ''}
                        onBlur={(event) => {
                          const value = event.target.value.trim()
                          void updateChannel(channel.streamId, {
                            customEpgId: value || null,
                          })
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={channel.customCategory ?? ''}
                        placeholder={channel.categoryName ?? ''}
                        onBlur={(event) => {
                          const value = event.target.value.trim()
                          void updateChannel(channel.streamId, {
                            customCategory: value || null,
                          })
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-24"
                        defaultValue={channel.sortOrder ?? ''}
                        placeholder={String(channel.num)}
                        onBlur={(event) => {
                          const raw = event.target.value.trim()
                          void updateChannel(channel.streamId, {
                            sortOrder: raw ? Number.parseInt(raw, 10) : null,
                          })
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
