# iptv-server

Single-tenant IPTV configuration server powered by **Bun**, **TanStack Start**, **SQLite**, and **shadcn/ui**. Connect Xtream-Codes providers, customize channel names, EPG IDs, categories, visibility, and sort order, then export the lineup as JSON, M3U, or XMLTV.

## Stack

- [Bun](https://bun.sh/) — runtime, package manager, and SQLite (`bun:sqlite`)
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

## Workflow

1. Open the dashboard and add an Xtream-Codes provider (server URL, username, password).
2. The server validates credentials against `player_api.php` and syncs live channels into SQLite.
3. Open a provider to customize channel names, EPG IDs, categories, visibility, and sort order.
4. Consume the customized lineup from the output endpoints below.

## API

Public HTTP endpoints live under `/api/*` as **server routes**.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/providers` | List providers |
| `POST` | `/api/providers` | Add provider and sync channels |
| `GET` | `/api/providers/:id` | Get provider |
| `PATCH` | `/api/providers/:id` | Update provider |
| `DELETE` | `/api/providers/:id` | Delete provider |
| `POST` | `/api/providers/:id/refresh` | Re-sync channels from Xtream |
| `GET` | `/api/providers/:id/channels` | List channels with overrides |
| `PATCH` | `/api/providers/:id/channels/:streamId` | Update channel override |
| `DELETE` | `/api/providers/:id/channels/:streamId` | Reset channel override |
| `GET` | `/api/lineup.json` | Customized lineup as JSON |
| `GET` | `/api/lineup.m3u` | Customized lineup as M3U playlist |
| `GET` | `/api/epg.xml` | Combined XMLTV EPG from all providers |

### Example: add a provider

```bash
curl -X POST http://localhost:3000/api/providers \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My IPTV",
    "serverUrl": "http://example.com:8080",
    "username": "user",
    "password": "pass"
  }'
```

### Example: get customized lineup

```bash
curl http://localhost:3000/api/lineup.json
```

### Example: override a channel

```bash
curl -X PATCH http://localhost:3000/api/providers/{providerId}/channels/123 \
  -H 'Content-Type: application/json' \
  -d '{
    "customName": "BBC One HD",
    "customEpgId": "bbc1.uk",
    "enabled": true,
    "sortOrder": 1
  }'
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port (production) |
| `CORS_ORIGIN` | `*` | Allowed origin for API CORS headers |
| `DATABASE_PATH` | `data/iptv.db` | SQLite database file path |
| `STREAM_OUTPUT_FORMAT` | `m3u8` | Stream URL extension in lineup output (`m3u8` or `ts`) |

## Project structure

```text
src/
  routes/          File-based routes (UI + API)
    api/           Server routes under /api/*
    providers/     Provider management UI
  components/ui/   shadcn/ui components
  lib/
    db/            SQLite schema and queries
    xtream/        Xtream-Codes API client
    lineup.ts      Lineup and M3U builders
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
