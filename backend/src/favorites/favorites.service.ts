import { Injectable, NotFoundException } from '@nestjs/common'
import { FavoriteType, ModelStatus, Prisma } from '@prisma/client'
import { presentModel, presentPost } from '../common/presenters'
import type { AuthUser } from '../common/types'
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
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(user: AuthUser, targetType: FavoriteType, targetId: string) {
    await this.assertTarget(targetType, targetId)

    return this.prisma.$transaction(async (tx) => {
      const key = { userId_type_targetId: { userId: user.id, type: targetType, targetId } }
      const existing = await tx.favorite.findUnique({
        where: key,
        select: { id: true },
      })

      if (existing) {
        await tx.favorite.delete({ where: key })
        return this.decreaseCounter(tx, targetType, targetId, false)
      }

      await tx.favorite.create({
        data: { userId: user.id, type: targetType, targetId },
      })
      return this.increaseCounter(tx, targetType, targetId)
    })
  }

  async status(user: AuthUser | null, targetType: FavoriteType, targetId: string) {
    if (!user) return { favorited: false }

    const row = await this.prisma.favorite.findUnique({
      where: { userId_type_targetId: { userId: user.id, type: targetType, targetId } },
      select: { id: true },
    })

    return { favorited: Boolean(row) }
  }

  async listMine(user: AuthUser) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const postIds = favorites
      .filter((item) => item.type === FavoriteType.POST)
      .map((item) => item.targetId)
    const modelIds = favorites
      .filter((item) => item.type === FavoriteType.MODEL)
      .map((item) => item.targetId)

    const [posts, models] = await Promise.all([
      postIds.length
        ? this.prisma.post.findMany({
            where: { id: { in: postIds }, isHidden: false },
            include: postInclude,
          })
        : [],
      modelIds.length
        ? this.prisma.modelPackage.findMany({
            where: { id: { in: modelIds }, status: ModelStatus.PUBLISHED },
            include: modelInclude,
          })
        : [],
    ])

    const postMap = new Map(posts.map((post) => [post.id, post]))
    const modelMap = new Map(models.map((model) => [model.id, model]))

    return {
      posts: favorites
        .filter((item) => item.type === FavoriteType.POST)
        .map((item) => postMap.get(item.targetId))
        .filter((post): post is NonNullable<typeof post> => Boolean(post))
        .map(presentPost),
      models: favorites
        .filter((item) => item.type === FavoriteType.MODEL)
        .map((item) => modelMap.get(item.targetId))
        .filter((model): model is NonNullable<typeof model> => Boolean(model))
        .map(presentModel),
    }
  }

  private async assertTarget(targetType: FavoriteType, targetId: string) {
    if (targetType === FavoriteType.POST) {
      const post = await this.prisma.post.findFirst({
        where: { id: targetId, isHidden: false },
        select: { id: true },
      })
      if (!post) throw new NotFoundException('帖子不存在或已被隐藏')
      return
    }

    const model = await this.prisma.modelPackage.findFirst({
      where: { id: targetId, status: ModelStatus.PUBLISHED },
      select: { id: true },
    })
    if (!model) throw new NotFoundException('模型包不存在或尚未发布')
  }

  private async increaseCounter(
    tx: Prisma.TransactionClient,
    targetType: FavoriteType,
    targetId: string,
  ) {
    if (targetType === FavoriteType.POST) {
      const updated = await tx.post.update({
        where: { id: targetId },
        data: { favoriteCount: { increment: 1 } },
        select: { favoriteCount: true },
      })
      return { favorited: true, favorites: updated.favoriteCount }
    }

    const updated = await tx.modelPackage.update({
      where: { id: targetId },
      data: { favoriteCount: { increment: 1 } },
      select: { favoriteCount: true },
    })
    return { favorited: true, favorites: updated.favoriteCount }
  }

  private async decreaseCounter(
    tx: Prisma.TransactionClient,
    targetType: FavoriteType,
    targetId: string,
    favorited: boolean,
  ) {
    if (targetType === FavoriteType.POST) {
      const current = await tx.post.findUniqueOrThrow({
        where: { id: targetId },
        select: { favoriteCount: true },
      })
      const favorites = Math.max(current.favoriteCount - 1, 0)
      await tx.post.update({
        where: { id: targetId },
        data: { favoriteCount: favorites },
      })
      return { favorited, favorites }
    }

    const current = await tx.modelPackage.findUniqueOrThrow({
      where: { id: targetId },
      select: { favoriteCount: true },
    })
    const favorites = Math.max(current.favoriteCount - 1, 0)
    await tx.modelPackage.update({
      where: { id: targetId },
      data: { favoriteCount: favorites },
    })
    return { favorited, favorites }
  }
}
