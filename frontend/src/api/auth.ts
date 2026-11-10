import { apiFetch } from './client'

export interface ApiUser {
  id: string
  username: string
  name?: string
  displayName?: string | null
  avatarUrl?: string | null
  bio?: string | null
  role?: string
  createdAt?: string | null
}

export interface AuthResponse {
  accessToken: string
  user: ApiUser
}

export function login(username: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    json: { username, password },
  })
}

export function register(payload: { username: string; password: string; email?: string }) {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    json: payload,
  })
}

export function fetchMe() {
  return apiFetch<ApiUser>('/api/auth/me')
}
