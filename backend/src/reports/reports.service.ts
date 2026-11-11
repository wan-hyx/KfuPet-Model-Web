import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ModelStatus, Prisma, ReportStatus, ReportTargetType } from '@prisma/client'
import { presentUser } from '../common/presenters'
import type { AuthUser } from '../common/types'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReportDto } from './dto/create-report.dto'
import { ListAdminReportsQueryDto } from './dto/list-admin-reports-query.dto'
import { ResolveReportDto } from './dto/resolve-report.dto'
import { UpdateReportStatusDto } from './dto/update-report-status.dto'

const reporterSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  role: true,
  createdAt: true,
} as const

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReportDto, user: AuthUser) {
    if (dto.targetType === ReportTargetType.POST) {
      const post = await this.prisma.post.findFirst({
        where: { id: dto.targetId, isHidden: false },
        select: { id: true, title: true, authorId: true },
      })

      if (!post) throw new NotFoundException('帖子不存在或已被隐藏')
      if (post.authorId === user.id) {
        throw new BadRequestException('不能举报自己发布的内容')
      }
    } else {
      const model = await this.prisma.modelPackage.findFirst({
        where: { id: dto.targetId, status: ModelStatus.PUBLISHED },
        select: { id: true, authorId: true },
      })

      if (!model) throw new NotFoundException('模型包不存在或尚未发布')
      if (model.authorId === user.id) {
        throw new BadRequestException('不能举报自己发布的内容')
      }
    }

    const duplicate = await this.prisma.report.findFirst({
      where: {
        reporterId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: { in: [ReportStatus.PENDING, ReportStatus.PROCESSING] },
      },
      select: { id: true },
    })

    if (duplicate) {
      throw new ConflictException('你已举报过该内容，请等待处理')
    }

    return this.prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason.trim(),
        detail: dto.detail.trim(),
      },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    })
  }

  async listAdmin(query: ListAdminReportsQueryDto) {
    const where: Prisma.ReportWhereInput = query.status ? { status: query.status } : {}

    const [items, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { reporter: { select: reporterSelect } },
      }),
      this.prisma.report.count({ where }),
    ])

    const postIds = items
      .filter((item) => item.targetType === ReportTargetType.POST)
      .map((item) => item.targetId)
    const modelIds = items
      .filter((item) => item.targetType === ReportTargetType.MODEL)
      .map((item) => item.targetId)

    const [posts, models] = await Promise.all([
      postIds.length
        ? this.prisma.post.findMany({
            where: { id: { in: postIds } },
            select: { id: true, title: true, isHidden: true },
          })
        : [],
      modelIds.length
        ? this.prisma.modelPackage.findMany({
            where: { id: { in: modelIds } },
            select: { id: true, name: true, status: true },
          })
        : [],
    ])

    const postMap = new Map(posts.map((post) => [post.id, post]))
    const modelMap = new Map(models.map((model) => [model.id, model]))

    return {
      items: items.map((report) => {
        const post = postMap.get(report.targetId)
        const model = modelMap.get(report.targetId)

        return {
          id: report.id,
          targetType: report.targetType,
          targetId: report.targetId,
          targetTitle:
            report.targetType === ReportTargetType.POST
              ? (post?.title ?? '帖子已删除')
              : (model?.name ?? '模型包已删除'),
          targetUrl:
            report.targetType === ReportTargetType.POST
              ? `/community/posts/${report.targetId}`
              : `/models/${report.targetId}`,
          targetAvailable:
            report.targetType === ReportTargetType.POST
              ? Boolean(post && !post.isHidden)
              : Boolean(model && model.status === ModelStatus.PUBLISHED),
          reason: report.reason,
          detail: report.detail,
          status: report.status,
          createdAt: report.createdAt,
          reporter: presentUser(report.reporter),
        }
      }),
      total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async updateStatus(id: string, dto: UpdateReportStatusDto) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!report) throw new NotFoundException('举报记录不存在')

    return this.prisma.report.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async applyVerdict(id: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { id: true, targetType: true, targetId: true, status: true },
    })

    if (!report) throw new NotFoundException('举报记录不存在')

    if (report.status !== ReportStatus.PENDING && report.status !== ReportStatus.PROCESSING) {
      throw new BadRequestException('该举报已处理，请先重新打开后再判定')
    }

    return this.prisma.$transaction(async (tx) => {
      let action: 'POST_HIDDEN' | 'MODEL_DELISTED' | 'TARGET_MISSING' | 'NONE' = 'NONE'

      if (dto.violation) {
        if (report.targetType === ReportTargetType.POST) {
          const updated = await tx.post.updateMany({
            where: { id: report.targetId },
            data: { isHidden: true },
          })
          action = updated.count ? 'POST_HIDDEN' : 'TARGET_MISSING'
        } else {
          const updated = await tx.modelPackage.updateMany({
            where: { id: report.targetId },
            data: { status: ModelStatus.DELISTED },
          })
          action = updated.count ? 'MODEL_DELISTED' : 'TARGET_MISSING'
        }
      }

      const updated = await tx.report.update({
        where: { id: report.id },
        data: { status: dto.violation ? ReportStatus.RESOLVED : ReportStatus.REJECTED },
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return { ...updated, action }
    })
  }
}
