import { apiFetch } from './client'
import type { ApiAuthor, ApiPostSummary } from './community'
import type { ApiModel } from './models'

export interface SearchUser extends ApiAuthor {
  stats: {
    posts: number
    models: number
  }
}

export interface SearchTag {
  name: string
  posts: number
  models: number
}

export interface SearchResult {
  posts: ApiPostSummary[]
  models: ApiModel[]
  users: SearchUser[]
  tags: SearchTag[]
}

export function searchAll(keyword: string, limit = 6) {
  const search = new URLSearchParams({ q: keyword, limit: String(limit) })
  return apiFetch<SearchResult>(`/api/search?${search.toString()}`)
}
