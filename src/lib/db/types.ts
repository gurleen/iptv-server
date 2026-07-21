export type Provider = {
  id: string
  name: string
  serverUrl: string
  username: string
  password: string
  createdAt: string
  lastSyncedAt: string | null
}

export type Channel = {
  providerId: string
  streamId: number
  num: number
  name: string
  streamIcon: string | null
  epgChannelId: string | null
  categoryId: string | null
  categoryName: string | null
  tvArchive: number
}

export type ChannelOverride = {
  providerId: string
  streamId: number
  customName: string | null
  customEpgId: string | null
  customIcon: string | null
  customCategory: string | null
  enabled: boolean
  sortOrder: number | null
}

export type MergedChannel = Channel & {
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

export type CreateProviderInput = {
  name: string
  serverUrl: string
  username: string
  password: string
}

export type UpdateProviderInput = Partial<CreateProviderInput>

export type UpsertChannelOverrideInput = {
  customName?: string | null
  customEpgId?: string | null
  customIcon?: string | null
  customCategory?: string | null
  enabled?: boolean
  sortOrder?: number | null
}

export type LineupChannel = {
  id: string
  providerId: string
  providerName: string
  streamId: number
  name: string
  streamUrl: string
  logo: string | null
  epgId: string | null
  category: string | null
  num: number
  sortOrder: number | null
}
