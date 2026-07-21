export type XtreamAuthResponse = {
  user_info?: {
    auth?: number
    status?: string
    message?: string
  }
}

export type XtreamCategory = {
  category_id: string
  category_name: string
  parent_id?: number
}

export type XtreamLiveStream = {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  epg_channel_id: string | null
  added: string
  category_id: string
  custom_sid: string
  tv_archive: number
  direct_source: string
  tv_archive_duration: number
}

export class XtreamError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'XtreamError'
  }
}

export function normalizeServerUrl(serverUrl: string): string {
  const trimmed = serverUrl.trim().replace(/\/+$/, '')
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `http://${trimmed}`
}

function buildApiUrl(
  serverUrl: string,
  username: string,
  password: string,
  action?: string,
): string {
  const base = normalizeServerUrl(serverUrl)
  const url = new URL(`${base}/player_api.php`)
  url.searchParams.set('username', username)
  url.searchParams.set('password', password)

  if (action) {
    url.searchParams.set('action', action)
  }

  return url.toString()
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new XtreamError(
      `Xtream request failed with status ${response.status}`,
    )
  }

  return (await response.json()) as T
}

export async function authenticate(
  serverUrl: string,
  username: string,
  password: string,
): Promise<void> {
  const url = buildApiUrl(serverUrl, username, password)
  const data = await fetchJson<XtreamAuthResponse>(url)

  if (data.user_info?.auth !== 1) {
    const message =
      data.user_info?.message ??
      data.user_info?.status ??
      'Invalid Xtream credentials'
    throw new XtreamError(message)
  }
}

export async function getLiveCategories(
  serverUrl: string,
  username: string,
  password: string,
): Promise<XtreamCategory[]> {
  const url = buildApiUrl(serverUrl, username, password, 'get_live_categories')
  const data = await fetchJson<XtreamCategory[] | null>(url)
  return data ?? []
}

export async function getLiveStreams(
  serverUrl: string,
  username: string,
  password: string,
): Promise<XtreamLiveStream[]> {
  const url = buildApiUrl(serverUrl, username, password, 'get_live_streams')
  const data = await fetchJson<XtreamLiveStream[] | null>(url)
  return data ?? []
}

export function buildStreamUrl(
  serverUrl: string,
  username: string,
  password: string,
  streamId: number,
  format: 'm3u8' | 'ts' = 'm3u8',
): string {
  const base = normalizeServerUrl(serverUrl)
  return `${base}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.${format}`
}

export function buildEpgUrl(
  serverUrl: string,
  username: string,
  password: string,
): string {
  const base = normalizeServerUrl(serverUrl)
  const url = new URL(`${base}/xmltv.php`)
  url.searchParams.set('username', username)
  url.searchParams.set('password', password)
  return url.toString()
}
