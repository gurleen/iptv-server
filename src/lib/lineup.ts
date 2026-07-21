import { listAllMergedChannels } from '@/lib/db'
import type { LineupChannel } from '@/lib/db/types'
import { buildStreamUrl } from '@/lib/xtream/client'

function getStreamFormat(): 'm3u8' | 'ts' {
  const format = process.env.STREAM_OUTPUT_FORMAT?.toLowerCase()
  return format === 'ts' ? 'ts' : 'm3u8'
}

export function buildLineup(): LineupChannel[] {
  const format = getStreamFormat()

  return listAllMergedChannels()
    .filter((channel) => channel.enabled)
    .map((channel) => ({
      id: `${channel.providerId}:${channel.streamId}`,
      providerId: channel.providerId,
      providerName: channel.providerName,
      streamId: channel.streamId,
      name: channel.displayName,
      streamUrl: buildStreamUrl(
        channel.serverUrl,
        channel.username,
        channel.password,
        channel.streamId,
        format,
      ),
      logo: channel.displayIcon,
      epgId: channel.displayEpgId,
      category: channel.displayCategory,
      num: channel.num,
      sortOrder: channel.sortOrder,
    }))
    .sort((a, b) => {
      const orderA = a.sortOrder ?? a.num
      const orderB = b.sortOrder ?? b.num
      if (orderA !== orderB) {
        return orderA - orderB
      }

      return a.name.localeCompare(b.name)
    })
}

export function buildM3uPlaylist(channels: LineupChannel[]): string {
  const lines = ['#EXTM3U']

  for (const channel of channels) {
    const logo = channel.logo ? ` tvg-logo="${channel.logo}"` : ''
    const epgId = channel.epgId ? ` tvg-id="${channel.epgId}"` : ''
    const group = channel.category
      ? ` group-title="${channel.category.replace(/"/g, '\\"')}"`
      : ''

    lines.push(
      `#EXTINF:-1${epgId}${logo}${group},${channel.name}`,
      channel.streamUrl,
    )
  }

  return `${lines.join('\n')}\n`
}
