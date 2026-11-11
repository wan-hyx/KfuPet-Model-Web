import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ModelStatus, Prisma, Role } from '@prisma/client'
import { extname } from 'node:path'
import { mediaUrl, presentUser } from '../common/presenters'
import type { AuthUser } from '../common/types'
import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto'
import { UpdateAdminUserDto } from './dto/update-admin-user.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

const AVATAR_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async me(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) throw new NotFoundException('用户不存在')

    return { ...presentUser(user), email: user.email }
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) throw new NotFoundException('用户不存在')

    const [postCount, modelCount, downloadSum, posts, models] = await Promise.all([
      this.prisma.post.count({ where: { authorId: id, isHidden: false } }),
      this.prisma.modelPackage.count({ where: { authorId: id, status: ModelStatus.PUBLISHED } }),
      this.prisma.modelPackage.aggregate({
        where: { authorId: id, status: ModelStatus.PUBLISHED },
        _sum: { downloadCount: true },
      }),
      this.prisma.post.findMany({
        where: { authorId: id, isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, createdAt: true },
      }),
      this.prisma.modelPackage.findMany({
        where: { authorId: id, status: ModelStatus.PUBLISHED },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          coverKey: true,
          coverUrl: true,
          downloadCount: true,
          updatedAt: true,
        },
      }),
    ])

    return {
      ...presentUser(user),
      stats: {
        posts: postCount,
        models: modelCount,
        downloads: downloadSum._sum.downloadCount ?? 0,
      },
      posts,
      models: models.map((model) => ({
        ...model,
        coverUrl: model.coverUrl ?? mediaUrl(model.coverKey),
      })),
    }
  }

  async updateMe(id: string, dto: UpdateProfileDto) {
    await this.prisma.user.update({
      where: { id },
      data: {
        displayName: dto.displayName?.trim(),
        bio: dto.bio?.trim(),
        avatarUrl: dto.avatarUrl?.trim(),
      },
    })

    return this.me(id)
  }

  async updateAvatar(id: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择头像图片')

    if (!AVATAR_EXTENSIONS.has(extname(file.originalname).toLowerCase())) {
      throw new BadRequestException('头像仅支持 JPG / PNG / WebP 格式')
    }

    const stored = await this.storage.put(file.buffer, 'images/avatars', file.originalname)

    await this.prisma.user.update({
      where: { id },
      data: { avatarUrl: mediaUrl(stored.key) },
    })

    return this.me(id)
  }

  async listAdminUsers(query: ListAdminUsersQueryDto) {
    const where: Prisma.UserWhereInput = {}
    const keyword = query.q?.trim()

    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { displayName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ]
    }

    if (query.role) where.role = query.role
    if (query.status === 'banned') where.isBanned = true
    if (query.status === 'active') where.isBanned = false

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: adminUserSelect,
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      items: items.map(presentAdminUser),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async updateAdminUser(id: string, dto: UpdateAdminUserDto, actor: AuthUser) {
    if (id === actor.id) {
      throw new BadRequestException('不能修改自己的角色或禁用状态')
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!user) throw new NotFoundException('用户不存在')

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role: dto.role,
        isBanned: dto.isBanned,
      },
      select: adminUserSelect,
    })

    return presentAdminUser(updated)
  }
}

const adminUserSelect = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  role: true,
  isBanned: true,
  createdAt: true,
  _count: { select: { posts: true, comments: true, models: true } },
} as const

function presentAdminUser(user: {
  id: string
  username: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  role: Role
  isBanned: boolean
  createdAt: Date
  _count: { posts: number; comments: number; models: number }
}) {
  return {
    ...presentUser(user),
    email: user.email,
    isBanned: user.isBanned,
    stats: {
      posts: user._count.posts,
      comments: user._count.comments,
      models: user._count.models,
    },
  }
}
