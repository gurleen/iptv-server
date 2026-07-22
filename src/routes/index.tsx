import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

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
import { Label } from '@/components/ui/label'

type ProviderSummary = {
  id: string
  name: string
  serverUrl: string
  username: string
  createdAt: string
  lastSyncedAt: string | null
}

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [providers, setProviders] = useState<ProviderSummary[]>([])
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    serverUrl: '',
    username: '',
    password: '',
  })

  async function loadProviders() {
    const response = await fetch('/api/providers')
    const data = (await response.json()) as { providers: ProviderSummary[] }
    setProviders(data.providers)
    setLoaded(true)
  }

  if (!loaded) {
    void loadProviders()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to add provider')
      }

      setForm({ name: '', serverUrl: '', username: '', password: '' })
      await loadProviders()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to add provider',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this provider and all cached channels?')) {
      return
    }

    await fetch(`/api/providers/${id}`, { method: 'DELETE' })
    await loadProviders()
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">IPTV Server</h1>
        <p className="text-muted-foreground">
          Configure Xtream-Codes providers, customize channels, and export your
          lineup as JSON, M3U, or XMLTV.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Providers</CardTitle>
            <CardDescription>
              Connected Xtream-Codes feeds synced into SQLite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No providers yet. Add your first Xtream credentials on the
                right.
              </p>
            ) : (
              providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/providers/$id"
                        params={{ id: provider.id }}
                        className="font-medium hover:underline"
                      >
                        {provider.name}
                      </Link>
                      {provider.lastSyncedAt ? (
                        <Badge variant="secondary">Synced</Badge>
                      ) : (
                        <Badge variant="outline">Not synced</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {provider.serverUrl}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last synced:{' '}
                      {provider.lastSyncedAt
                        ? new Date(provider.lastSyncedAt).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/providers/$id" params={{ id: provider.id }}>
                        Manage
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDelete(provider.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add provider</CardTitle>
            <CardDescription>
              Credentials are validated against the Xtream API before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="My IPTV"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serverUrl">Server URL</Label>
                <Input
                  id="serverUrl"
                  value={form.serverUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      serverUrl: event.target.value,
                    }))
                  }
                  placeholder="http://example.com:8080"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Adding…' : 'Add provider'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Output endpoints</CardTitle>
          <CardDescription>
            Use these URLs in players or downstream integrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline">
            <a href="/api/lineup.json" target="_blank" rel="noreferrer">
              lineup.json
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/lineup.m3u" target="_blank" rel="noreferrer">
              lineup.m3u
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/epg.xml" target="_blank" rel="noreferrer">
              epg.xml
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
