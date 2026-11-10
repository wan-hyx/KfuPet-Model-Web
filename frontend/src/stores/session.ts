import { readonly, reactive, computed } from 'vue'
import { fetchMe, login as apiLogin, register as apiRegister, type ApiUser } from '@/api/auth'
import { SESSION_STORAGE_KEY } from '@/api/client'

export type SessionRole = 'USER' | 'ADMIN'

export interface SessionUser {
  id: string
  username: string
  name: string
  role: SessionRole
  avatarUrl: string | null
}

interface PersistedSession {
  token: string
  user: SessionUser
}

function readPersisted(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<PersistedSession>
    if (typeof parsed.token !== 'string' || !parsed.token) return null
    if (!parsed.user?.id) return null

    return {
      token: parsed.token,
      user: { ...parsed.user, avatarUrl: parsed.user.avatarUrl ?? null } as SessionUser,
    }
  } catch {
    return null
  }
}

const persisted = readPersisted()

const state = reactive({
  token: persisted?.token ?? '',
  user: persisted?.user ?? (null as SessionUser | null),
  ready: false,
})

let restorePromise: Promise<void> | null = null

export const session = readonly(state)
export const isLoggedIn = computed(() => Boolean(state.token && state.user))
export const isAdmin = computed(() => state.user?.role === 'ADMIN')

export function normalizeUser(user: ApiUser): SessionUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name ?? user.displayName ?? user.username,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    avatarUrl: user.avatarUrl ?? null,
  }
}

function persist(token: string, user: SessionUser) {
  state.token = token
  state.user = user
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user }))
}

function clear() {
  state.token = ''
  state.user = null
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export async function login(username: string, password: string) {
  const result = await apiLogin(username, password)
  persist(result.accessToken, normalizeUser(result.user))
  state.ready = true
  return state.user
}

export async function register(payload: { username: string; password: string; email?: string }) {
  const result = await apiRegister(payload)
  persist(result.accessToken, normalizeUser(result.user))
  state.ready = true
  return state.user
}

export function logout() {
  clear()
  state.ready = true
}

export function patchSessionUser(patch: Partial<Pick<SessionUser, 'name' | 'avatarUrl'>>) {
  if (!state.user || !state.token) return

  state.user = { ...state.user, ...patch }
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: state.token, user: state.user }),
  )
}

export function ensureSession(): Promise<void> {
  if (state.ready) return Promise.resolve()
  if (!state.token) {
    state.ready = true
    return Promise.resolve()
  }
  if (restorePromise) return restorePromise

  restorePromise = (async () => {
    try {
      const me = await fetchMe()
      state.user = normalizeUser(me)
    } catch {
      clear()
    } finally {
      state.ready = true
      restorePromise = null
    }
  })()

  return restorePromise
}
