import { Injectable } from '@nestjs/common'
import { ModelStatus, Prisma } from '@prisma/client'
import {
  presentModel,
  presentNotice,
  presentPost,
  presentUpdate,
} from '../common/presenters'
import { PrismaService } from '../prisma/prisma.service'

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  role: true,
  createdAt: true,
} as const

const postInclude = {
  author: { select: authorSelect },
  category: true,
  tags: { include: { tag: true } },
} satisfies Prisma.PostInclude

const modelInclude = {
  author: { select: authorSelect },
  category: true,
  tags: { include: { tag: true } },
  versions: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.ModelPackageInclude

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const now = new Date()

    const [
      posts,
      models,
      updates,
      notices,
      publishedModels,
      totalPosts,
      totalDownloads,
      authors,
    ] = await Promise.all([
      this.prisma.post.findMany({
        where: { isHidden: false },
        include: postInclude,
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.modelPackage.findMany({
        where: { status: ModelStatus.PUBLISHED },
        include: modelInclude,
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.modelVersion.findMany({
        where: { model: { status: ModelStatus.PUBLISHED } },
        include: { model: { include: modelInclude } },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      this.prisma.notice.findMany({
        where: { publishedAt: { lte: now } },
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        take: 3,
      }),
      this.prisma.modelPackage.count({ where: { status: ModelStatus.PUBLISHED } }),
      this.prisma.post.count({ where: { isHidden: false } }),
      this.prisma.modelPackage.aggregate({
        where: { status: ModelStatus.PUBLISHED },
        _sum: { downloadCount: true },
      }),
      this.prisma.modelPackage.findMany({
        where: { status: ModelStatus.PUBLISHED },
        distinct: ['authorId'],
        select: { authorId: true },
      }),
    ])

    return {
      stats: {
        models: publishedModels,
        creators: authors.length,
        downloads: totalDownloads._sum.downloadCount ?? 0,
        posts: totalPosts,
      },
      posts: posts.map(presentPost),
      models: models.map(presentModel),
      updates: updates.map(presentUpdate),
      notices: notices.map(presentNotice),
    }
  }
}
