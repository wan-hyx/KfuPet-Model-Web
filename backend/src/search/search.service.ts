import { Injectable } from '@nestjs/common'
import { ModelStatus, Prisma } from '@prisma/client'
import { presentModel, presentPost, presentUser } from '../common/presenters'
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

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(keyword: string, limit: number) {
    const q = keyword.trim()
    if (!q) {
      return { posts: [], models: [], users: [], tags: [] }
    }

    const contains: Prisma.StringFilter = { contains: q, mode: 'insensitive' }

    const [posts, models, users, tags] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          isHidden: false,
          OR: [
            { title: contains },
            { content: contains },
            { excerpt: contains },
            { tags: { some: { tag: { name: contains } } } },
          ],
        },
        include: {
          author: { select: authorSelect },
          category: true,
          tags: { include: { tag: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      }),
      this.prisma.modelPackage.findMany({
        where: {
          status: ModelStatus.PUBLISHED,
          OR: [
            { name: contains },
            { summary: contains },
            { description: contains },
            { tags: { some: { tag: { name: contains } } } },
          ],
        },
        include: {
          author: { select: authorSelect },
          category: true,
          tags: { include: { tag: true } },
          versions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: [{ downloadCount: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      }),
      this.prisma.user.findMany({
        where: {
          isBanned: false,
          OR: [{ username: contains }, { displayName: contains }, { bio: contains }],
        },
        select: {
          ...authorSelect,
          _count: { select: { posts: true, models: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      }),
      this.prisma.tag.findMany({
        where: { name: contains },
        include: { _count: { select: { posts: true, models: true } } },
        orderBy: { name: 'asc' },
        take: limit,
      }),
    ])

    return {
      posts: posts.map(presentPost),
      models: models.map(presentModel),
      users: users.map((user) => ({
        ...presentUser(user),
        stats: {
          posts: user._count.posts,
          models: user._count.models,
        },
      })),
      tags: tags.map((tag) => ({
        name: tag.name,
        posts: tag._count.posts,
        models: tag._count.models,
      })),
    }
  }
}
