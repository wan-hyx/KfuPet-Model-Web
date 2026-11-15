import { apiFetch } from './client'

export type NotificationType =
  | 'POST_COMMENT'
  | 'COMMENT_REPLY'
  | 'MODEL_APPROVED'
  | 'MODEL_REJECTED'
  | 'MODEL_DELISTED'
  | 'MODEL_RESTORED'

export interface ApiNotification {
  id: string
  type: NotificationType
  title: string
  content: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationPage {
  items: ApiNotification[]
  total: number
  page: number
  pageSize: number
  unreadCount: number
}

export function listNotifications(page = 1, pageSize = 20) {
  return apiFetch<NotificationPage>(
    `/api/notifications?page=${page}&pageSize=${pageSize}`,
  )
}

export function fetchUnreadCount() {
  return apiFetch<{ count: number }>('/api/notifications/unread-count')
}

export function markNotificationRead(id: string) {
  return apiFetch<{ success: boolean }>(`/api/notifications/${id}/read`, {
    method: 'POST',
  })
}

export function markAllNotificationsRead() {
  return apiFetch<{ success: boolean }>('/api/notifications/read-all', {
    method: 'POST',
  })
}
