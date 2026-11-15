import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { Prisma, FavoriteType, ModelStatus, NotificationType, Role } from '@prisma/client'
import type { AuthUser } from '../common/types'
import { makeExcerpt, normalizeTags } from '../common/text'
import { presentPost, presentPostDetail, presentUser } from '../common/presenters'
import { NotificationsService } from '../notifications/notifications.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { ListAdminPostsQueryDto } from './dto/list-admin-posts-query.dto'
import { ListPostsQueryDto } from './dto/list-posts-query.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { UpdatePostFlagsDto } from './dto/update-post-flags.dto'

const postInclude = {
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  },
  category: true,
  tags: { include: { tag: true } },
  relatedModels: {
    include: {
      model: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
              role: true,
              createdAt: true,
            },
          },
          category: true,
          tags: { include: { tag: true } },
          versions: { orderBy: { createdAt: 'desc' as const }, take: 1 },
        },
      },
    },
  },
} satisfies Prisma.PostInclude

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  listCategories() {
    return this.prisma.postCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    })
  }

  async listPosts(query: ListPostsQueryDto) {
    const where: Prisma.PostWhereInput = { isHidden: false }

    if (query.category) {
      where.category = { slug: query.category }
    }

    if (query.tag) {
      const tag = query.tag.replace(/^#+/, '').trim()
      if (tag) {
        where.tags = { some: { tag: { name: { equals: tag, mode: 'insensitive' } } } }
      }
    }

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { content: { contains: query.q, mode: 'insensitive' } },
      ]
    }

    const orderBy: Prisma.PostOrderByWithRelationInput[] =
      query.sort === 'hot'
        ? [{ views: 'desc' }, { createdAt: 'desc' }]
        : [{ isPinned: 'desc' }, { createdAt: 'desc' }]

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        include: postInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.post.count({ where }),
    ])

    return {
      items: items.map(presentPost),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async listAdminPosts(query: ListAdminPostsQueryDto) {
    const where: Prisma.PostWhereInput = {}
    const keyword = query.q?.trim()

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    if (query.filter === 'hidden') where.isHidden = true
    if (query.filter === 'pinned') where.isPinned = true
    if (query.filter === 'featured') where.isFeatured = true

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.post.count({ where }),
    ])

    return {
      items: items.map(presentPost),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async updatePostFlags(id: string, dto: UpdatePostFlagsDto) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!post) throw new NotFoundException('帖子不存在')

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        isHidden: dto.isHidden,
        isPinned: dto.isPinned,
        isFeatured: dto.isFeatured,
      },
      include: postInclude,
    })

    return presentPostDetail(updated)
  }

  async getPost(id: string, viewer?: AuthUser | null) {
    const post = await this.prisma.post.findFirst({
      where: { id, isHidden: false },
      include: postInclude,
    })

    if (!post) throw new NotFoundException('帖子不存在')

    let liked = false
    let favorited = false
    if (viewer) {
      const [likedRow, favoriteRow] = await Promise.all([
        this.prisma.postLike.findUnique({
          where: { postId_userId: { postId: id, userId: viewer.id } },
          select: { postId: true },
        }),
        this.prisma.favorite.findUnique({
          where: {
            userId_type_targetId: {
              userId: viewer.id,
              type: FavoriteType.POST,
              targetId: id,
            },
          },
          select: { id: true },
        }),
      ])
      liked = Boolean(likedRow)
      favorited = Boolean(favoriteRow)
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { views: true },
    })

    return { ...presentPostDetail({ ...post, views: updated.views }), liked, favorited }
  }

  async toggleLike(postId: string, user: AuthUser) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, isHidden: false },
      select: { id: true, authorId: true },
    })

    if (!post) throw new NotFoundException('帖子不存在')
    if (post.authorId === user.id) {
      throw new ForbiddenException('不能给自己的帖子点赞')
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.postLike.findUnique({
        where: { postId_userId: { postId, userId: user.id } },
        select: { postId: true },
      })

      if (existing) {
        await tx.postLike.delete({
          where: { postId_userId: { postId, userId: user.id } },
        })
        const current = await tx.post.findUniqueOrThrow({
          where: { id: postId },
          select: { likes: true },
        })
        const likes = Math.max(current.likes - 1, 0)
        await tx.post.update({ where: { id: postId }, data: { likes } })
        return { liked: false, likes }
      }

      await tx.postLike.create({ data: { postId, userId: user.id } })
      const updated = await tx.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      })

      return { liked: true, likes: updated.likes }
    })
  }

  async createPost(dto: CreatePostDto, user: AuthUser) {
    const category = await this.resolveCategory(dto.categorySlug)
    const tagIds = await this.upsertTags(dto.tags)
    const relatedModelIds = await this.resolveRelatedModels(dto.relatedModelIds)
    const excerpt = dto.excerpt?.trim() || makeExcerpt(dto.content)

    const post = await this.prisma.post.create({
      data: {
        title: dto.title.trim(),
        content: dto.content,
        excerpt,
        authorId: user.id,
        categoryId: category.id,
        tags: {
          create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
        relatedModels: {
          create: relatedModelIds.map((modelId) => ({
            model: { connect: { id: modelId } },
          })),
        },
      },
      include: postInclude,
    })

    return presentPostDetail(post)
  }

  async updatePost(id: string, dto: UpdatePostDto, user: AuthUser) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    })

    if (!post) throw new NotFoundException('帖子不存在')
    this.assertOwnerOrAdmin(post.authorId, user)

    const category = dto.categorySlug ? await this.resolveCategory(dto.categorySlug) : null
    const tagIds = dto.tags ? await this.upsertTags(dto.tags) : null
    const relatedModelIds = dto.relatedModelIds
      ? await this.resolveRelatedModels(dto.relatedModelIds)
      : null

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content,
        excerpt: dto.excerpt?.trim() || (dto.content ? makeExcerpt(dto.content) : undefined),
        ...(category ? { category: { connect: { id: category.id } } } : {}),
        ...(tagIds
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
              },
            }
          : {}),
        ...(relatedModelIds
          ? {
              relatedModels: {
                deleteMany: {},
                create: relatedModelIds.map((modelId) => ({
                  model: { connect: { id: modelId } },
                })),
              },
            }
          : {}),
      },
      include: postInclude,
    })

    return presentPostDetail(updated)
  }

  async deletePost(id: string, user: AuthUser) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    })

    if (!post) throw new NotFoundException('帖子不存在')
    this.assertOwnerOrAdmin(post.authorId, user)

    await this.prisma.post.delete({ where: { id } })
    return { success: true }
  }

  async listComments(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })
    if (!post) throw new NotFoundException('帖子不存在')

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            role: true,
            createdAt: true,
          },
        },
      },
    })

    return comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      likes: comment.likes,
      createdAt: comment.createdAt,
      author: presentUser(comment.author),
    }))
  }

  async createComment(postId: string, dto: CreateCommentDto, user: AuthUser) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, title: true, authorId: true },
    })
    if (!post) throw new NotFoundException('帖子不存在')

    let parentAuthorId: string | null = null
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, postId: true, authorId: true },
      })
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('回复的评论不属于当前帖子')
      }
      parentAuthorId = parent.authorId
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId,
          authorId: user.id,
          parentId: dto.parentId ?? null,
          content: dto.content,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
              role: true,
              createdAt: true,
            },
          },
        },
      })

      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      })

      return created
    })

    await this.notifyComment(post, parentAuthorId, dto.content, user)

    return {
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      likes: comment.likes,
      createdAt: comment.createdAt,
      author: presentUser(comment.author),
    }
  }

  async deleteComment(id: string, user: AuthUser) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true, postId: true },
    })

    if (!comment) throw new NotFoundException('评论不存在')
    this.assertOwnerOrAdmin(comment.authorId, user)

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.delete({ where: { id } })
      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      })
    })

    return { success: true }
  }

  private async resolveRelatedModels(ids?: string[]) {
    const unique = Array.from(
      new Set((ids ?? []).map((id) => id.trim()).filter(Boolean)),
    ).slice(0, 3)

    if (!unique.length) return []

    const models = await this.prisma.modelPackage.findMany({
      where: { id: { in: unique }, status: ModelStatus.PUBLISHED },
      select: { id: true },
    })

    if (models.length !== unique.length) {
      throw new BadRequestException('关联的模型包不存在或尚未发布')
    }

    return models.map((model) => model.id)
  }

  private async notifyComment(
    post: { id: string; title: string; authorId: string },
    parentAuthorId: string | null,
    content: string,
    user: AuthUser,
  ) {
    const actorName = user.displayName ?? user.username
    const preview = makeExcerpt(content)
    const link = `/community/posts/${post.id}`

    try {
      if (parentAuthorId && parentAuthorId !== user.id) {
        await this.notifications.create({
          userId: parentAuthorId,
          type: NotificationType.COMMENT_REPLY,
          title: '有人回复了你的评论',
          content: `${actorName} 在《${post.title}》中回复了你：${preview}`,
          link,
        })
        return
      }

      if (post.authorId !== user.id) {
        await this.notifications.create({
          userId: post.authorId,
          type: NotificationType.POST_COMMENT,
          title: '有人评论了你的帖子',
          content: `${actorName} 评论了《${post.title}》：${preview}`,
          link,
        })
      }
    } catch {
      // 通知失败不影响评论发布
    }
  }

  private async resolveCategory(slug?: string) {
    const category = await this.prisma.postCategory.findUnique({
      where: { slug: slug?.trim() || 'general' },
    })

    if (!category) throw new BadRequestException('帖子分类不存在')
    return category
  }

  private async upsertTags(tags?: string[]) {
    const names = normalizeTags(tags)
    const ids: string[] = []

    for (const name of names) {
      const tag = await this.prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true },
      })
      ids.push(tag.id)
    }

    return ids
  }

  private assertOwnerOrAdmin(authorId: string, user: AuthUser) {
    if (authorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('只能操作自己发布的内容')
    }
  }
}

