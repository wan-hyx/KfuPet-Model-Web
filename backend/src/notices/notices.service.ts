import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.notice.findMany({
      where: { publishedAt: { lte: new Date() } },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      select: { id: true, title: true, content: true, pinned: true, publishedAt: true },
    })
  }

  async get(id: string) {
    const notice = await this.prisma.notice.findFirst({
      where: { id, publishedAt: { lte: new Date() } },
    })

    if (!notice) throw new NotFoundException('公告不存在或尚未发布')

    return notice
  }
}
