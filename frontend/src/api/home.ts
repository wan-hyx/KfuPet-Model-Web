import coverSnow from '@/assets/art/cover-snow.svg'
import coverShiba from '@/assets/art/cover-shiba.svg'
import coverNeo from '@/assets/art/cover-neo.svg'
import coverDragon from '@/assets/art/cover-dragon.svg'
import coverGhost from '@/assets/art/cover-ghost.svg'
import coverPixel from '@/assets/art/cover-pixel.svg'
import type {
  HeroStat,
  ModelPackage,
  ModelUpdate,
  Notice,
  Post,
} from '@/data/home'
import { formatCount } from '@/utils/format'

interface ApiUser {
  id: string
  username: string
  name: string
  avatarUrl?: string | null
}

interface ApiPost {
  id: string
  title: string
  excerpt: string
  views: number
  likes: number
  comments: number
  publishedAt: string
  author: ApiUser
  category: { name: string; slug: string }
  tags: string[]
}

interface ApiModel {
  id: string
  name: string
  summary: string
  description: string
  coverUrl: string | null
  downloads: number
  favorites: number
  publishedAt: string
  updatedAt: string
  author: ApiUser
  category: { name: string; slug: string }
  tags: string[]
  version: string | null
  versionId: string | null
  sizeBytes: number
}

interface ApiUpdate {
  id: string
  name: string
  version: string
  coverUrl: string | null
  note: string
  createdAt: string
}

interface ApiNotice {
  id: string
  title: string
  pinned: boolean
  publishedAt: string
}

interface ApiHomeResponse {
  stats: {
    models: number
    creators: number
    downloads: number
    posts: number
  }
  posts: ApiPost[]
  models: ApiModel[]
  updates: ApiUpdate[]
  notices: ApiNotice[]
}

export interface HomeData {
  stats: HeroStat[]
  posts: Post[]
  models: ModelPackage[]
  updates: ModelUpdate[]
  notices: Notice[]
}

const coverFallback: Record<string, string> = {
  '雪团 · 猫娘': coverSnow,
  '豆柴小次郎': coverShiba,
  'NEO-07 机械猫': coverNeo,
  '青鳞 · 龙娘': coverDragon,
  '小幽灵糯糯': coverGhost,
  '像素柴犬 PIX-8': coverPixel,
}

const categoryTone: Record<string, Post['categoryTone']> = {
  general: 'discuss',
  usage: 'use',
  feedback: 'bug',
  character: 'create',
  model: 'create',
  development: 'dev',
  tools: 'tool',
  notice: 'discuss',
}

export async function fetchHomeData(): Promise<HomeData> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch('/api/home', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`首页接口返回 ${response.status}`)
    }

    const payload = (await response.json()) as ApiHomeResponse
    return mapHome(payload)
  } finally {
    clearTimeout(timer)
  }
}

function mapHome(payload: ApiHomeResponse): HomeData {
  return {
    stats: [
      { value: formatCount(payload.stats.models), label: '已发布模型包' },
      { value: formatCount(payload.stats.creators), label: '活跃创作者' },
      { value: formatCount(payload.stats.downloads), label: '累计下载' },
    ],
    posts: payload.posts.map(mapPost),
    models: payload.models.map(mapModel),
    updates: payload.updates.map(mapUpdate),
    notices: payload.notices.map(mapNotice),
  }
}

function mapPost(post: ApiPost): Post {
  const author = displayName(post.author)

  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    author,
    avatar: initialOf(author),
    avatarUrl: post.author.avatarUrl ?? null,
    avatarTone: toneFromId(post.author.id),
    category: post.category.name,
    categoryTone: categoryTone[post.category.slug] ?? 'discuss',
    timeLabel: relativeTime(post.publishedAt),
    publishedAt: post.publishedAt,
    views: post.views,
    likes: post.likes,
    comments: post.comments,
  }
}

function mapModel(model: ApiModel): ModelPackage {
  const author = displayName(model.author)

  return {
    id: model.id,
    name: model.name,
    author,
    avatar: initialOf(author),
    avatarUrl: model.author.avatarUrl ?? null,
    avatarTone: toneFromId(model.author.id),
    cover: model.coverUrl || coverFallback[model.name] || coverSnow,
    coverAlt: `模型包「${model.name}」封面插画`,
    version: model.version ?? 'v1.0.0',
    category: model.category.name,
    size: formatSize(model.sizeBytes),
    description: model.summary,
    tags: model.tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)),
    downloads: model.downloads,
    publishedAt: model.publishedAt,
    updatedAt: model.updatedAt,
  }
}

function mapUpdate(update: ApiUpdate): ModelUpdate {
  return {
    id: update.id,
    name: update.name,
    version: update.version,
    cover: update.coverUrl || coverFallback[update.name] || coverSnow,
    note: update.note,
    timeLabel: relativeTime(update.createdAt),
  }
}

function mapNotice(notice: ApiNotice): Notice {
  return {
    id: notice.id,
    title: notice.title,
    pinned: notice.pinned,
    date: formatShortDate(notice.publishedAt),
  }
}

function displayName(user: ApiUser): string {
  return user.name || user.username
}

function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? 'K'
}

function toneFromId(id: string): number {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return (hash % 6) + 1
}

function relativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return '刚刚'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`
  if (seconds < 172800) return '昨天'
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`

  return formatShortDate(value)
}

function formatShortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

function formatSize(bytes: number): string {
  if (!bytes) return '—'

  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(1)} MB`

  const kb = Math.max(bytes / 1024, 0.1)
  return `${kb.toFixed(1)} KB`
}
