import { apiFetch } from './client'
import type { ApiPostSummary, Paged } from './community'

export type AdminRole = 'USER' | 'ADMIN'

export interface AdminUser {
  id: string
  username: string
  name: string
  email: string | null
  avatarUrl: string | null
  bio: string | null
  role: AdminRole
  isBanned: boolean
  createdAt: string
  stats: {
    posts: number
    comments: number
    models: number
  }
}

export interface AdminUserListParams {
  q?: string
  role?: AdminRole
  status?: 'active' | 'banned'
  page?: number
  pageSize?: number
}

export function listAdminUsers(params: AdminUserListParams = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.role) search.set('role', params.role)
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()

  return apiFetch<Paged<AdminUser>>(`/api/admin/users${query ? `?${query}` : ''}`)
}

export function updateAdminUser(
  id: string,
  payload: { role?: AdminRole; isBanned?: boolean },
) {
  return apiFetch<AdminUser>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    json: payload,
  })
}

export type AdminPostFilter = 'all' | 'hidden' | 'pinned' | 'featured'

export interface AdminPost extends ApiPostSummary {
  hidden: boolean
}

export interface AdminPostListParams {
  q?: string
  filter?: AdminPostFilter
  page?: number
  pageSize?: number
}

export function listAdminPosts(params: AdminPostListParams = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.filter) search.set('filter', params.filter)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()

  return apiFetch<Paged<AdminPost>>(`/api/admin/posts${query ? `?${query}` : ''}`)
}

export function updateAdminPostFlags(
  id: string,
  payload: { isHidden?: boolean; isPinned?: boolean; isFeatured?: boolean },
) {
  return apiFetch<AdminPost>(`/api/admin/posts/${id}`, {
    method: 'PATCH',
    json: payload,
  })
}
