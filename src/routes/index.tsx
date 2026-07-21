import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>iptv-server</CardTitle>
          <CardDescription>
            Full-stack React app powered by Bun, TanStack Start, and shadcn/ui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The API is available under <code>/api/*</code>. Try{' '}
            <code>GET /api/health</code> to verify the server is running.
          </p>
          <Button asChild>
            <a href="/api/health" target="_blank" rel="noreferrer">
              Check API health
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
