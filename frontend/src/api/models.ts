import { apiFetch } from './client'
import type { ApiAuthor, ApiCategory, Paged } from './community'

export type { ApiAuthor, ApiCategory, Paged } from './community'

export type ModelStatus = 'DRAFT' | 'PENDING' | 'REVIEWING' | 'PUBLISHED' | 'REJECTED' | 'DELISTED'

export interface ApiModelVersion {
  id: string
  version: string
  sizeBytes: number
  sha256: string
  changelog: string
  minClientVersion: string | null
  downloads: number
  createdAt: string
}

export interface ApiModel {
  id: string
  name: string
  summary: string
  description: string
  coverUrl: string | null
  status: ModelStatus
  downloads: number
  favorites: number
  publishedAt: string
  updatedAt: string
  author: ApiAuthor
  category: ApiCategory
  tags: string[]
  version: string | null
  versionId: string | null
  sizeBytes: number
  latestVersion: ApiModelVersion | null
}

export interface ModelListParams {
  sort?: 'latest' | 'hot' | 'updated'
  q?: string
  category?: string
  page?: number
  pageSize?: number
}

export interface CreateModelPayload {
  name: string
  summary: string
  description: string
  categorySlug: string
  tags: string
  version: string
  changelog: string
  minClientVersion?: string
  packageFile: File
  coverFile?: File | null
}

export interface CreateVersionPayload {
  version: string
  changelog: string
  minClientVersion?: string
  packageFile: File
}

export function listModelCategories() {
  return apiFetch<ApiCategory[]>('/api/models/categories')
}

export function listModels(params: ModelListParams = {}) {
  const search = new URLSearchParams()
  if (params.sort) search.set('sort', params.sort)
  if (params.q) search.set('q', params.q)
  if (params.category) search.set('category', params.category)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()

  return apiFetch<Paged<ApiModel>>(`/api/models${query ? `?${query}` : ''}`)
}

export function getModel(id: string) {
  return apiFetch<ApiModel>(`/api/models/${id}`)
}

export function listMyModels() {
  return apiFetch<ApiModel[]>('/api/models/mine')
}

export function listModelVersions(id: string) {
  return apiFetch<ApiModelVersion[]>(`/api/models/${id}/versions`)
}

export function downloadUrl(modelId: string, versionId: string) {
  return `/api/models/${modelId}/versions/${versionId}/download?source=web`
}

export function createModel(payload: CreateModelPayload) {
  const form = new FormData()
  form.append('name', payload.name)
  form.append('summary', payload.summary)
  form.append('description', payload.description)
  form.append('categorySlug', payload.categorySlug)
  form.append('tags', payload.tags)
  form.append('version', payload.version)
  form.append('changelog', payload.changelog)
  if (payload.minClientVersion) form.append('minClientVersion', payload.minClientVersion)
  form.append('package', payload.packageFile)
  if (payload.coverFile) form.append('cover', payload.coverFile)

  return apiFetch<ApiModel>('/api/models', { method: 'POST', form })
}

export function createModelVersion(modelId: string, payload: CreateVersionPayload) {
  const form = new FormData()
  form.append('version', payload.version)
  form.append('changelog', payload.changelog)
  if (payload.minClientVersion) form.append('minClientVersion', payload.minClientVersion)
  form.append('package', payload.packageFile)

  return apiFetch<ApiModel>(`/api/models/${modelId}/versions`, { method: 'POST', form })
}

export function listAdminModels(status?: ModelStatus) {
  const query = status ? `?status=${status}` : ''
  return apiFetch<ApiModel[]>(`/api/admin/models${query}`)
}

export function updateModelStatus(id: string, status: ModelStatus) {
  return apiFetch<ApiModel>(`/api/admin/models/${id}/status`, {
    method: 'PATCH',
    json: { status },
  })
}
