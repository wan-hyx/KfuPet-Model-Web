import { apiFetch } from './client'

export interface ApiAuthor {
  id: string
  username: string
  name: string
  avatarUrl: string | null
  bio: string | null
  role: string
}

export interface ApiCategory {
  id: string
  name: string
  slug: string
}

export interface ApiPostSummary {
  id: string
  title: string
  excerpt: string
  views: number
  likes: number
  comments: number
  pinned: boolean
  featured: boolean
  publishedAt: string
  author: ApiAuthor
  category: ApiCategory
  tags: string[]
}

export interface ApiPostDetail extends ApiPostSummary {
  content: string
  liked?: boolean
}

export interface ApiComment {
  id: string
  content: string
  parentId: string | null
  likes: number
  createdAt: string
  author: ApiAuthor
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface PostListParams {
  sort?: 'latest' | 'hot'
  category?: string
  q?: string
  page?: number
  pageSize?: number
}

export function listPostCategories() {
  return apiFetch<ApiCategory[]>('/api/community/categories')
}

export function listPosts(params: PostListParams = {}) {
  const search = new URLSearchParams()
  if (params.sort) search.set('sort', params.sort)
  if (params.category) search.set('category', params.category)
  if (params.q) search.set('q', params.q)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()

  return apiFetch<Paged<ApiPostSummary>>(`/api/community/posts${query ? `?${query}` : ''}`)
}

export function getPost(id: string) {
  return apiFetch<ApiPostDetail>(`/api/community/posts/${id}`)
}

export function createPost(payload: {
  title: string
  content: string
  excerpt?: string
  categorySlug: string
  tags?: string[]
}) {
  return apiFetch<ApiPostDetail>('/api/community/posts', {
    method: 'POST',
    json: payload,
  })
}

export function deletePost(id: string) {
  return apiFetch<{ success: boolean }>(`/api/community/posts/${id}`, { method: 'DELETE' })
}

export function togglePostLike(id: string) {
  return apiFetch<{ liked: boolean; likes: number }>(`/api/community/posts/${id}/like`, {
    method: 'POST',
  })
}

export function listComments(postId: string) {
  return apiFetch<ApiComment[]>(`/api/community/posts/${postId}/comments`)
}

export function createComment(postId: string, payload: { content: string; parentId?: string }) {
  return apiFetch<ApiComment>(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    json: payload,
  })
}

export function deleteComment(id: string) {
  return apiFetch<{ success: boolean }>(`/api/community/comments/${id}`, { method: 'DELETE' })
}
