import { apiFetch } from './client'
import type { ApiAuthor, Paged } from './community'

export type ReportTargetType = 'POST' | 'MODEL'
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED'

export interface AdminReport {
  id: string
  targetType: ReportTargetType
  targetId: string
  targetTitle: string
  targetUrl: string
  targetAvailable: boolean
  reason: string
  detail: string
  status: ReportStatus
  createdAt: string
  reporter: ApiAuthor
}

export function createReport(payload: {
  targetType: ReportTargetType
  targetId: string
  reason: string
  detail: string
}) {
  return apiFetch<{
    id: string
    targetType: ReportTargetType
    targetId: string
    reason: string
    status: ReportStatus
    createdAt: string
  }>('/api/reports', {
    method: 'POST',
    json: payload,
  })
}

export function listAdminReports(params: {
  status?: ReportStatus
  page?: number
  pageSize?: number
} = {}) {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  const query = search.toString()

  return apiFetch<Paged<AdminReport>>(`/api/admin/reports${query ? `?${query}` : ''}`)
}

export function updateReportStatus(id: string, status: ReportStatus) {
  return apiFetch<{ id: string; status: ReportStatus }>(`/api/admin/reports/${id}`, {
    method: 'PATCH',
    json: { status },
  })
}

export type VerdictAction = 'POST_HIDDEN' | 'MODEL_DELISTED' | 'TARGET_MISSING' | 'NONE'

export function resolveReport(id: string, violation: boolean) {
  return apiFetch<{
    id: string
    status: ReportStatus
    targetType: ReportTargetType
    targetId: string
    action: VerdictAction
  }>(`/api/admin/reports/${id}/verdict`, {
    method: 'POST',
    json: { violation },
  })
}
