export interface UserLike {
  id: string
  username: string
  displayName: string | null
  avatarUrl?: string | null
  bio?: string | null
  role?: string
  createdAt?: Date
}

export interface PostLike {
  id: string
  title: string
  content: string
  excerpt: string | null
  views: number
  likes: number
  favoriteCount?: number
  commentCount: number
  createdAt: Date
  isPinned?: boolean
  isFeatured?: boolean
  isHidden?: boolean
  author: UserLike
  category: { id: string; name: string; slug: string }
  tags: Array<{ tag: { name: string } }>
  relatedModels?: Array<{ model: ModelLike }>
}

export interface VersionLike {
  id: string
  version: string
  fileKey?: string
  fileSize: number
  sha256: string
  changelog: string
  minClientVersion: string | null
  downloadCount: number
  createdAt: Date
}

export interface ModelLike {
  id: string
  name: string
  summary: string
  description: string
  coverKey: string | null
  coverUrl: string | null
  status?: string
  downloadCount: number
  favoriteCount: number
  createdAt: Date
  updatedAt: Date
  author: UserLike
  category: { id: string; name: string; slug: string }
  tags: Array<{ tag: { name: string } }>
  versions: VersionLike[]
  postLinks?: Array<{ post: PostLike }>
}

export function presentUser(user: UserLike) {
  return {
    id: user.id,
    username: user.username,
    name: user.displayName ?? user.username,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    role: user.role ?? 'USER',
    createdAt: user.createdAt ?? null,
  }
}

export function presentPost(post: PostLike) {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt ?? '',
    views: post.views,
    likes: post.likes,
    favorites: post.favoriteCount ?? 0,
    comments: post.commentCount,
    pinned: post.isPinned ?? false,
    featured: post.isFeatured ?? false,
    hidden: post.isHidden ?? false,
    publishedAt: post.createdAt,
    author: presentUser(post.author),
    category: {
      id: post.category.id,
      name: post.category.name,
      slug: post.category.slug,
    },
    tags: post.tags.map((item) => item.tag.name),
  }
}

export function presentPostDetail(post: PostLike) {
  return {
    ...presentPost(post),
    content: post.content,
    relatedModels: (post.relatedModels ?? []).map(({ model }) => ({
      id: model.id,
      name: model.name,
      summary: model.summary,
      coverUrl: model.coverUrl ?? mediaUrl(model.coverKey),
      downloadCount: model.downloadCount,
      version: model.versions[0]?.version ?? null,
      category: {
        id: model.category.id,
        name: model.category.name,
        slug: model.category.slug,
      },
    })),
  }
}

export function mediaUrl(coverKey: string | null) {
  if (!coverKey) return null
  const key = coverKey.startsWith('images/') ? coverKey.slice('images/'.length) : coverKey
  return `/media/${key}`
}

export function presentModel(model: ModelLike) {
  const latest = model.versions[0] ?? null
  const coverUrl = model.coverUrl ?? mediaUrl(model.coverKey)

  return {
    id: model.id,
    name: model.name,
    summary: model.summary,
    description: model.description,
    coverUrl,
    status: model.status ?? 'PUBLISHED',
    downloads: model.downloadCount,
    favorites: model.favoriteCount,
    publishedAt: model.createdAt,
    updatedAt: latest?.createdAt ?? model.updatedAt,
    author: presentUser(model.author),
    category: {
      id: model.category.id,
      name: model.category.name,
      slug: model.category.slug,
    },
    tags: model.tags.map((item) => item.tag.name),
    version: latest?.version ?? null,
    versionId: latest?.id ?? null,
    sizeBytes: latest?.fileSize ?? 0,
    latestVersion: latest
      ? {
          id: latest.id,
          version: latest.version,
          sizeBytes: latest.fileSize,
          sha256: latest.sha256,
          changelog: latest.changelog,
          minClientVersion: latest.minClientVersion,
          downloads: latest.downloadCount,
          createdAt: latest.createdAt,
        }
      : null,
    relatedPosts: (model.postLinks ?? []).map(({ post }) => ({
      id: post.id,
      title: post.title,
      comments: post.commentCount,
      publishedAt: post.createdAt,
      author: presentUser(post.author),
    })),
  }
}

export function presentVersion(version: VersionLike) {
  return {
    id: version.id,
    version: version.version,
    sizeBytes: version.fileSize,
    sha256: version.sha256,
    changelog: version.changelog,
    minClientVersion: version.minClientVersion,
    downloads: version.downloadCount,
    createdAt: version.createdAt,
  }
}

export function presentUpdate(version: VersionLike & { model: ModelLike }) {
  return {
    id: version.id,
    modelId: version.model.id,
    name: version.model.name,
    version: version.version,
    coverUrl: version.model.coverUrl ?? mediaUrl(version.model.coverKey),
    note: version.changelog,
    createdAt: version.createdAt,
  }
}

export function presentNotice(notice: {
  id: string
  title: string
  pinned: boolean
  publishedAt: Date
}) {
  return {
    id: notice.id,
    title: notice.title,
    pinned: notice.pinned,
    publishedAt: notice.publishedAt,
  }
}
