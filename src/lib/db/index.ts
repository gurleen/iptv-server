import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { SCHEMA } from '@/lib/db/schema'
import type {
  Channel,
  CreateProviderInput,
  MergedChannel,
  Provider,
  UpsertChannelOverrideInput,
  UpdateProviderInput,
} from '@/lib/db/types'

const DEFAULT_DB_PATH = 'data/iptv.db'

function getDbPath(): string {
  return process.env.DATABASE_PATH ?? DEFAULT_DB_PATH
}

function openDatabase(): Database {
  const dbPath = getDbPath()
  mkdirSync(dirname(dbPath), { recursive: true })

  const db = new Database(dbPath, { create: true })
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(SCHEMA)

  return db
}

let dbInstance: Database | null = null

export function getDb(): Database {
  if (!dbInstance) {
    dbInstance = openDatabase()
  }

  return dbInstance
}

type ProviderRow = {
  id: string
  name: string
  server_url: string
  username: string
  password: string
  created_at: string
  last_synced_at: string | null
}

function mapProvider(row: ProviderRow): Provider {
  return {
    id: row.id,
    name: row.name,
    serverUrl: row.server_url,
    username: row.username,
    password: row.password,
    createdAt: row.created_at,
    lastSyncedAt: row.last_synced_at,
  }
}

type ChannelRow = {
  provider_id: string
  stream_id: number
  num: number
  name: string
  stream_icon: string | null
  epg_channel_id: string | null
  category_id: string | null
  category_name: string | null
  tv_archive: number
}

function mapChannel(row: ChannelRow): Channel {
  return {
    providerId: row.provider_id,
    streamId: row.stream_id,
    num: row.num,
    name: row.name,
    streamIcon: row.stream_icon,
    epgChannelId: row.epg_channel_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    tvArchive: row.tv_archive,
  }
}

type MergedChannelRow = ChannelRow & {
  custom_name: string | null
  custom_epg_id: string | null
  custom_icon: string | null
  custom_category: string | null
  enabled: number | null
  sort_order: number | null
}

function mapMergedChannel(row: MergedChannelRow): MergedChannel {
  const channel = mapChannel(row)
  const customName = row.custom_name
  const customEpgId = row.custom_epg_id
  const customIcon = row.custom_icon
  const customCategory = row.custom_category
  const enabled = row.enabled === null ? true : row.enabled === 1
  const sortOrder = row.sort_order

  return {
    ...channel,
    customName,
    customEpgId,
    customIcon,
    customCategory,
    enabled,
    sortOrder,
    displayName: customName ?? channel.name,
    displayEpgId: customEpgId ?? channel.epgChannelId,
    displayIcon: customIcon ?? channel.streamIcon,
    displayCategory: customCategory ?? channel.categoryName,
  }
}

export function listProviders(): Provider[] {
  const db = getDb()
  const rows = db
    .query('SELECT * FROM providers ORDER BY created_at ASC')
    .all() as ProviderRow[]

  return rows.map(mapProvider)
}

export function getProvider(id: string): Provider | null {
  const db = getDb()
  const row = db
    .query('SELECT * FROM providers WHERE id = ?')
    .get(id) as ProviderRow | null

  return row ? mapProvider(row) : null
}

export function createProvider(input: CreateProviderInput): Provider {
  const db = getDb()
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  db.query(
    `INSERT INTO providers (id, name, server_url, username, password, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.name, input.serverUrl, input.username, input.password, createdAt)

  return getProvider(id)!
}

export function updateProvider(
  id: string,
  input: UpdateProviderInput,
): Provider | null {
  const existing = getProvider(id)
  if (!existing) {
    return null
  }

  const db = getDb()
  db.query(
    `UPDATE providers
     SET name = ?, server_url = ?, username = ?, password = ?
     WHERE id = ?`,
  ).run(
    input.name ?? existing.name,
    input.serverUrl ?? existing.serverUrl,
    input.username ?? existing.username,
    input.password ?? existing.password,
    id,
  )

  return getProvider(id)
}

export function deleteProvider(id: string): boolean {
  const db = getDb()
  const result = db.query('DELETE FROM providers WHERE id = ?').run(id)
  return result.changes > 0
}

export function setProviderLastSynced(id: string, syncedAt: string): void {
  const db = getDb()
  db.query('UPDATE providers SET last_synced_at = ? WHERE id = ?').run(
    syncedAt,
    id,
  )
}

export function replaceChannels(
  providerId: string,
  channels: Omit<Channel, 'providerId'>[],
): void {
  const db = getDb()

  const replace = db.transaction(() => {
    db.query('DELETE FROM channels WHERE provider_id = ?').run(providerId)

    const insert = db.query(
      `INSERT INTO channels (
        provider_id, stream_id, num, name, stream_icon, epg_channel_id,
        category_id, category_name, tv_archive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )

    for (const channel of channels) {
      insert.run(
        providerId,
        channel.streamId,
        channel.num,
        channel.name,
        channel.streamIcon,
        channel.epgChannelId,
        channel.categoryId,
        channel.categoryName,
        channel.tvArchive,
      )
    }
  })

  replace()
}

export function listMergedChannels(providerId: string): MergedChannel[] {
  const db = getDb()
  const rows = db
    .query(
      `SELECT
        c.*,
        o.custom_name,
        o.custom_epg_id,
        o.custom_icon,
        o.custom_category,
        o.enabled,
        o.sort_order
      FROM channels c
      LEFT JOIN channel_overrides o
        ON c.provider_id = o.provider_id AND c.stream_id = o.stream_id
      WHERE c.provider_id = ?
      ORDER BY COALESCE(o.sort_order, c.num), c.num, c.name`,
    )
    .all(providerId) as MergedChannelRow[]

  return rows.map(mapMergedChannel)
}

export function getMergedChannel(
  providerId: string,
  streamId: number,
): MergedChannel | null {
  const db = getDb()
  const row = db
    .query(
      `SELECT
        c.*,
        o.custom_name,
        o.custom_epg_id,
        o.custom_icon,
        o.custom_category,
        o.enabled,
        o.sort_order
      FROM channels c
      LEFT JOIN channel_overrides o
        ON c.provider_id = o.provider_id AND c.stream_id = o.stream_id
      WHERE c.provider_id = ? AND c.stream_id = ?`,
    )
    .get(providerId, streamId) as MergedChannelRow | null

  return row ? mapMergedChannel(row) : null
}

export function upsertChannelOverride(
  providerId: string,
  streamId: number,
  input: UpsertChannelOverrideInput,
): MergedChannel | null {
  const channel = getMergedChannel(providerId, streamId)
  if (!channel) {
    return null
  }

  const db = getDb()
  const existingOverride = db
    .query(
      'SELECT * FROM channel_overrides WHERE provider_id = ? AND stream_id = ?',
    )
    .get(providerId, streamId) as
    | {
        custom_name: string | null
        custom_epg_id: string | null
        custom_icon: string | null
        custom_category: string | null
        enabled: number
        sort_order: number | null
      }
    | null

  const customName =
    input.customName !== undefined
      ? input.customName
      : (existingOverride?.custom_name ?? null)
  const customEpgId =
    input.customEpgId !== undefined
      ? input.customEpgId
      : (existingOverride?.custom_epg_id ?? null)
  const customIcon =
    input.customIcon !== undefined
      ? input.customIcon
      : (existingOverride?.custom_icon ?? null)
  const customCategory =
    input.customCategory !== undefined
      ? input.customCategory
      : (existingOverride?.custom_category ?? null)
  const enabled =
    input.enabled !== undefined
      ? input.enabled
      : (existingOverride?.enabled ?? 1) === 1
  const sortOrder =
    input.sortOrder !== undefined
      ? input.sortOrder
      : (existingOverride?.sort_order ?? null)

  db.query(
    `INSERT INTO channel_overrides (
      provider_id, stream_id, custom_name, custom_epg_id, custom_icon,
      custom_category, enabled, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider_id, stream_id) DO UPDATE SET
      custom_name = excluded.custom_name,
      custom_epg_id = excluded.custom_epg_id,
      custom_icon = excluded.custom_icon,
      custom_category = excluded.custom_category,
      enabled = excluded.enabled,
      sort_order = excluded.sort_order`,
  ).run(
    providerId,
    streamId,
    customName,
    customEpgId,
    customIcon,
    customCategory,
    enabled ? 1 : 0,
    sortOrder,
  )

  return getMergedChannel(providerId, streamId)
}

export function deleteChannelOverride(
  providerId: string,
  streamId: number,
): boolean {
  const db = getDb()
  const result = db
    .query(
      'DELETE FROM channel_overrides WHERE provider_id = ? AND stream_id = ?',
    )
    .run(providerId, streamId)

  return result.changes > 0
}

export function listAllMergedChannels(): Array<
  MergedChannel & {
    providerName: string
    serverUrl: string
    username: string
    password: string
  }
> {
  const db = getDb()
  const rows = db
    .query(
      `SELECT
        c.*,
        p.name AS provider_name,
        p.server_url,
        p.username,
        p.password,
        o.custom_name,
        o.custom_epg_id,
        o.custom_icon,
        o.custom_category,
        o.enabled,
        o.sort_order
      FROM channels c
      INNER JOIN providers p ON p.id = c.provider_id
      LEFT JOIN channel_overrides o
        ON c.provider_id = o.provider_id AND c.stream_id = o.stream_id
      ORDER BY p.name, COALESCE(o.sort_order, c.num), c.num, c.name`,
    )
    .all() as Array<
    MergedChannelRow & {
      provider_name: string
      server_url: string
      username: string
      password: string
    }
  >

  return rows.map((row) => ({
    ...mapMergedChannel(row),
    providerName: row.provider_name,
    serverUrl: row.server_url,
    username: row.username,
    password: row.password,
  }))
}

export function sanitizeProvider(provider: Provider) {
  const { password: _password, ...rest } = provider
  return rest
}
