import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ModelStatus } from '@prisma/client'
import { extname } from 'node:path'
import { mediaUrl, presentUser } from '../common/presenters'
import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'
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
}
