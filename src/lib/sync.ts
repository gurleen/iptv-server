import {
  replaceChannels,
  setProviderLastSynced,
  type Provider,
} from '@/lib/db'
import {
  getLiveCategories,
  getLiveStreams,
  XtreamError,
} from '@/lib/xtream/client'

export async function syncProviderChannels(provider: Provider): Promise<number> {
  const [categories, streams] = await Promise.all([
    getLiveCategories(provider.serverUrl, provider.username, provider.password),
    getLiveStreams(provider.serverUrl, provider.username, provider.password),
  ])

  const categoryNames = new Map(
    categories.map((category) => [category.category_id, category.category_name]),
  )

  replaceChannels(
    provider.id,
    streams.map((stream) => ({
      streamId: stream.stream_id,
      num: stream.num,
      name: stream.name,
      streamIcon: stream.stream_icon || null,
      epgChannelId: stream.epg_channel_id || null,
      categoryId: stream.category_id || null,
      categoryName: categoryNames.get(stream.category_id) ?? null,
      tvArchive: stream.tv_archive ?? 0,
    })),
  )

  setProviderLastSynced(provider.id, new Date().toISOString())
  return streams.length
}

export { XtreamError }
