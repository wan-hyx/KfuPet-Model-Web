import { apiFetch } from './client'

export interface ApiNotice {
  id: string
  title: string
  content: string
  pinned: boolean
  publishedAt: string
}

export function listNotices() {
  return apiFetch<ApiNotice[]>('/api/notices')
}

export function getNotice(id: string) {
  return apiFetch<ApiNotice>(`/api/notices/${id}`)
}
