# iptv-server

Full-stack React application powered by **Bun**, **TanStack Start**, and **shadcn/ui**. Serves a web UI and HTTP API endpoints from the same server.

## Stack

- [Bun](https://bun.sh/) — runtime and package manager
- [TanStack Start](https://tanstack.com/start) — SSR, routing, server routes, and server functions
- [shadcn/ui](https://ui.shadcn.com/) — UI components (Tailwind CSS v4)
- [Nitro](https://nitro.build/) — production server (Bun preset)

## Getting started

```bash
bun install
cp .env.example .env
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the Vite dev server |
| `bun run build` | Build for production |
| `bun run start` | Run the production Bun/Nitro server |
| `bun run preview` | Preview the production build locally |
| `bun run generate-routes` | Regenerate the TanStack Router route tree |

## API

Public HTTP endpoints live under `/api/*` as **server routes**. These are intended for the frontend and external services.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |

Example:

```bash
curl http://localhost:3000/api/health
```

### Server routes vs server functions

- **Server routes** (`src/routes/api/*`) — REST-style HTTP endpoints callable from anywhere. Use these for public APIs and integrations.
- **Server functions** (`createServerFn`) — Same-origin RPC for app-internal logic. Start handles serialization between client and server.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port (production) |
| `CORS_ORIGIN` | `*` | Allowed origin for API CORS headers |

## Project structure

```text
src/
  routes/          File-based routes (UI + API)
    api/           Server routes under /api/*
  components/ui/   shadcn/ui components
  lib/             Shared utilities and API helpers
```

## Adding UI components

```bash
bunx shadcn@latest add <component>
```

## Adding API routes

Create a file under `src/routes/api/` with a `server.handlers` block, then run:

```bash
bun run generate-routes
```

See [TanStack Start server routes docs](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes).
