export const SESSION_STORAGE_KEY = 'kfupet.session.v1'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  json?: unknown
  form?: FormData
  signal?: AbortSignal
}

interface StoredSession {
  token?: string
}

function currentToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    return typeof parsed?.token === 'string' && parsed.token ? parsed.token : null
  } catch {
    return null
  }
}

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  const token = currentToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body: BodyInit | undefined
  if (options.form) {
    body = options.form
  } else if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method: options.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      signal: options.signal,
    })
  } catch {
    throw new ApiError('无法连接服务器，请确认后端服务已启动', 0)
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(payload.message)) return payload.message.join('；')
    if (typeof payload.message === 'string' && payload.message) return payload.message
  } catch {
    // 忽略非 JSON 错误响应
  }

  return `请求失败（${response.status}）`
}
