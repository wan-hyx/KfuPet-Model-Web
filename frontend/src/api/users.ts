import { apiFetch } from './client'

export interface MyProfile {
  id: string
  username: string
  name: string
  email: string | null
  avatarUrl: string | null
  bio: string | null
  role: string
  createdAt: string | null
}

export interface ProfilePost {
  id: string
  title: string
  createdAt: string
}

export interface ProfileModel {
  id: string
  name: string
  coverUrl: string | null
  downloadCount: number
  updatedAt: string
}

export interface PublicProfile {
  id: string
  username: string
  name: string
  avatarUrl: string | null
  bio: string | null
  role: string
  createdAt: string | null
  stats: {
    posts: number
    models: number
    downloads: number
  }
  posts: ProfilePost[]
  models: ProfileModel[]
}

export function fetchMyProfile() {
  return apiFetch<MyProfile>('/api/users/me')
}

export function updateMyProfile(payload: {
  displayName?: string
  avatarUrl?: string
  bio?: string
}) {
  return apiFetch<MyProfile>('/api/users/me', {
    method: 'PATCH',
    json: payload,
  })
}

export function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('avatar', file)

  return apiFetch<MyProfile>('/api/users/me/avatar', {
    method: 'POST',
    form,
  })
}

export function fetchUserProfile(id: string) {
  return apiFetch<PublicProfile>(`/api/users/${id}`)
}
