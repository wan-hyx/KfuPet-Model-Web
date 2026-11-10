import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DownloadSource, ModelStatus, Prisma, Role } from '@prisma/client'
import type { Response } from 'express'
import { access } from 'node:fs/promises'
import { extname } from 'node:path'
import { normalizeTags } from '../common/text'
import { presentModel, presentUpdate, presentVersion } from '../common/presenters'
import type { AuthUser } from '../common/types'
import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'
import { CreateModelDto } from './dto/create-model.dto'
import { ListModelsQueryDto } from './dto/list-models-query.dto'
import { UploadVersionDto } from './dto/upload-version.dto'

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  role: true,
  createdAt: true,
} as const

const modelInclude = {
  author: { select: authorSelect },
  category: true,
  tags: { include: { tag: true } },
  versions: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.ModelPackageInclude

const modelDetailInclude = {
  author: { select: authorSelect },
  category: true,
  tags: { include: { tag: true } },
  versions: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.ModelPackageInclude

export interface ModelUploadFiles {
  package?: Express.Multer.File[]
  cover?: Express.Multer.File[]
}

const COVER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg'])

@Injectable()
export class ModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  listCategories() {
    return this.prisma.modelCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    })
  }

  async listModels(query: ListModelsQueryDto) {
    const where: Prisma.ModelPackageWhereInput = { status: ModelStatus.PUBLISHED }

    if (query.category) {
      where.category = { slug: query.category }
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { summary: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ]
    }

    const orderBy: Prisma.ModelPackageOrderByWithRelationInput[] =
      query.sort === 'hot'
        ? [{ downloadCount: 'desc' }, { createdAt: 'desc' }]
        : query.sort === 'updated'
          ? [{ updatedAt: 'desc' }]
          : [{ createdAt: 'desc' }]

    const [items, total] = await this.prisma.$transaction([
      this.prisma.modelPackage.findMany({
        where,
        include: modelInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.modelPackage.count({ where }),
    ])

    return {
      items: items.map(presentModel),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async listMyModels(user: AuthUser) {
    const models = await this.prisma.modelPackage.findMany({
      where: { authorId: user.id },
      include: modelInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return models.map(presentModel)
  }

  async listUpdates(limit = 4) {
    const take = Math.min(Math.max(limit, 1), 10)
    const versions = await this.prisma.modelVersion.findMany({
      where: { model: { status: ModelStatus.PUBLISHED } },
      orderBy: { createdAt: 'desc' },
      take,
      include: { model: { include: modelInclude } },
    })

    return versions.map(presentUpdate)
  }

  async getModel(id: string) {
    const model = await this.prisma.modelPackage.findFirst({
      where: { id, status: ModelStatus.PUBLISHED },
      include: modelDetailInclude,
    })

    if (!model) throw new NotFoundException('模型包不存在或尚未发布')

    return presentModel(model)
  }

  async listVersions(id: string) {
    const model = await this.prisma.modelPackage.findFirst({
      where: { id, status: ModelStatus.PUBLISHED },
      select: { id: true },
    })

    if (!model) throw new NotFoundException('模型包不存在或尚未发布')

    const versions = await this.prisma.modelVersion.findMany({
      where: { modelId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        version: true,
        fileSize: true,
        sha256: true,
        changelog: true,
        minClientVersion: true,
        downloadCount: true,
        createdAt: true,
      },
    })

    return versions.map(presentVersion)
  }

  async createModel(dto: CreateModelDto, files: ModelUploadFiles, user: AuthUser) {
    const packageFile = files.package?.[0]
    this.assertPackageFile(packageFile)

    const coverFile = files.cover?.[0]
    if (coverFile) this.assertCoverFile(coverFile)

    const category = await this.resolveCategory(dto.categorySlug)
    const version = normalizeVersion(dto.version)
    const tags = await this.upsertTags(splitTags(dto.tags))

    const storedPackage = await this.storage.put(
      packageFile.buffer,
      'packages/models',
      packageFile.originalname,
    )
    const storedCover = coverFile
      ? await this.storage.put(coverFile.buffer, 'images/models', coverFile.originalname)
      : null

    const model = await this.prisma.$transaction(async (tx) => {
      const created = await tx.modelPackage.create({
        data: {
          name: dto.name.trim(),
          summary: dto.summary.trim(),
          description: dto.description.trim(),
          authorId: user.id,
          categoryId: category.id,
          coverKey: storedCover?.key ?? null,
          status: ModelStatus.PENDING,
          tags: {
            create: tags.map((tagId) => ({ tag: { connect: { id: tagId } } })),
          },
        },
      })

      await tx.modelVersion.create({
        data: {
          modelId: created.id,
          version,
          fileKey: storedPackage.key,
          fileSize: storedPackage.size,
          sha256: storedPackage.sha256,
          changelog: dto.changelog.trim(),
          minClientVersion: dto.minClientVersion?.trim() || null,
        },
      })

      return tx.modelPackage.findUniqueOrThrow({
        where: { id: created.id },
        include: modelInclude,
      })
    })

    return presentModel(model)
  }

  async createVersion(
    modelId: string,
    dto: UploadVersionDto,
    files: ModelUploadFiles,
    user: AuthUser,
  ) {
    const model = await this.prisma.modelPackage.findUnique({
      where: { id: modelId },
      select: { id: true, authorId: true },
    })

    if (!model) throw new NotFoundException('模型包不存在')
    this.assertOwnerOrAdmin(model.authorId, user)

    const packageFile = files.package?.[0]
    this.assertPackageFile(packageFile)

    const version = normalizeVersion(dto.version)
    const exists = await this.prisma.modelVersion.findUnique({
      where: { modelId_version: { modelId, version } },
      select: { id: true },
    })
    if (exists) throw new ConflictException('该版本号已存在')

    const storedPackage = await this.storage.put(
      packageFile.buffer,
      'packages/models',
      packageFile.originalname,
    )

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.modelVersion.create({
        data: {
          modelId,
          version,
          fileKey: storedPackage.key,
          fileSize: storedPackage.size,
          sha256: storedPackage.sha256,
          changelog: dto.changelog.trim(),
          minClientVersion: dto.minClientVersion?.trim() || null,
        },
      })

      await tx.modelPackage.update({
        where: { id: modelId },
        data: { updatedAt: new Date() },
      })

      return tx.modelPackage.findUniqueOrThrow({
        where: { id: modelId },
        include: modelInclude,
      })
    })

    return presentModel(updated)
  }

  async listAdminModels(status?: ModelStatus) {
    const models = await this.prisma.modelPackage.findMany({
      where: status ? { status } : {},
      include: modelInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return models.map(presentModel)
  }

  async updateStatus(id: string, status: ModelStatus) {
    const model = await this.prisma.modelPackage.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!model) throw new NotFoundException('模型包不存在')

    const updated = await this.prisma.modelPackage.update({
      where: { id },
      data: { status },
      include: modelInclude,
    })

    return presentModel(updated)
  }

  async download(
    modelId: string,
    versionId: string,
    source: string | undefined,
    userAgent: string | undefined,
    res: Response,
  ) {
    const version = await this.prisma.modelVersion.findFirst({
      where: {
        id: versionId,
        modelId,
        model: { status: ModelStatus.PUBLISHED },
      },
      include: {
        model: { select: { id: true, name: true } },
      },
    })

    if (!version) throw new NotFoundException('模型包版本不存在或未发布')

    const filePath = this.storage.getAbsolutePath(version.fileKey)
    try {
      await access(filePath)
    } catch {
      throw new NotFoundException('模型文件不存在')
    }

    await this.prisma.$transaction([
      this.prisma.modelVersion.update({
        where: { id: version.id },
        data: { downloadCount: { increment: 1 } },
      }),
      this.prisma.modelPackage.update({
        where: { id: modelId },
        data: { downloadCount: { increment: 1 } },
      }),
      this.prisma.downloadRecord.create({
        data: {
          modelId,
          versionId,
          source: source === 'client' ? DownloadSource.CLIENT : DownloadSource.WEB,
          userAgent: userAgent ?? null,
        },
      }),
    ])

    const displayName = `${version.model.name}-${version.version}.kfupet`
    const downloadMode = this.config.get<string>('DOWNLOAD_MODE') ?? 'direct'

    if (downloadMode === 'nginx') {
      const asciiName = `kfupet-${version.version.replace(/[^\w.-]/g, '_')}.kfupet`
      res.setHeader('X-Accel-Redirect', `/files/${version.fileKey}`)
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(displayName)}`,
      )
      res.end()
      return
    }

    res.download(filePath, displayName)
  }

  private async resolveCategory(slug: string) {
    const category = await this.prisma.modelCategory.findUnique({
      where: { slug: slug.trim() },
    })
    if (!category) throw new BadRequestException('模型包分类不存在')
    return category
  }

  private async upsertTags(names: string[]) {
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

  private assertPackageFile(file?: Express.Multer.File): asserts file is Express.Multer.File {
    if (!file) throw new BadRequestException('请上传 .kfupet 模型包文件')

    if (extname(file.originalname).toLowerCase() !== '.kfupet') {
      throw new BadRequestException('模型包文件需为 .kfupet 格式')
    }

    const maxMb = Number(this.config.get<string>('UPLOAD_MAX_SIZE') ?? 256)
    if (file.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`模型包不能超过 ${maxMb} MB`)
    }
  }

  private assertCoverFile(file: Express.Multer.File) {
    if (!COVER_EXTENSIONS.has(extname(file.originalname).toLowerCase())) {
      throw new BadRequestException('封面仅支持 PNG / JPG / WebP / SVG')
    }
  }

  private assertOwnerOrAdmin(authorId: string, user: AuthUser) {
    if (authorId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('只能操作自己发布的模型包')
    }
  }
}

function normalizeVersion(input: string) {
  const version = input.trim()
  return version.startsWith('v') ? version : `v${version}`
}

function splitTags(input?: string) {
  if (!input) return []
  return normalizeTags(input.split(/[,，]/))
}
