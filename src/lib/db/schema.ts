export const SCHEMA = `
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  server_url TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_synced_at TEXT
);

CREATE TABLE IF NOT EXISTS channels (
  provider_id TEXT NOT NULL,
  stream_id INTEGER NOT NULL,
  num INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  stream_icon TEXT,
  epg_channel_id TEXT,
  category_id TEXT,
  category_name TEXT,
  tv_archive INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (provider_id, stream_id),
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS channel_overrides (
  provider_id TEXT NOT NULL,
  stream_id INTEGER NOT NULL,
  custom_name TEXT,
  custom_epg_id TEXT,
  custom_icon TEXT,
  custom_category TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER,
  PRIMARY KEY (provider_id, stream_id),
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);
`
