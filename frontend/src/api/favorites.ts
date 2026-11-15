import { apiFetch } from './client'
import type { ApiPostSummary } from './community'
import type { ApiModel } from './models'

export type FavoriteType = 'POST' | 'MODEL'

export interface FavoriteLists {
  posts: ApiPostSummary[]
  models: ApiModel[]
}

export interface FavoriteToggleResult {
  favorited: boolean
  favorites: number
}

export function toggleFavorite(targetType: FavoriteType, targetId: string) {
  return apiFetch<FavoriteToggleResult>('/api/favorites/toggle', {
    method: 'POST',
    json: { targetType, targetId },
  })
}

export function getFavoriteStatus(targetType: FavoriteType, targetId: string) {
  const search = new URLSearchParams({ targetType, targetId })
  return apiFetch<{ favorited: boolean }>(`/api/favorites/status?${search.toString()}`)
}

export function listMyFavorites() {
  return apiFetch<FavoriteLists>('/api/favorites')
}
