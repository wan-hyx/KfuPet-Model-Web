import { Injectable } from '@nestjs/common'
import { NotificationType, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  content: string
  link?: string | null
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        link: input.link ?? null,
      },
      select: notificationSelect,
    })
  }

  async list(userId: string, page: number, pageSize: number) {
    const where: Prisma.NotificationWhereInput = { userId }

    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: notificationSelect,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ])

    return {
      items: items.map(presentNotification),
      total,
      page,
      pageSize,
      unreadCount,
    }
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    })

    return { count }
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    })

    return { success: true }
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return { success: true }
  }
}

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  content: true,
  link: true,
  isRead: true,
  createdAt: true,
} as const

function presentNotification(notification: {
  id: string
  type: NotificationType
  title: string
  content: string
  link: string | null
  isRead: boolean
  createdAt: Date
}) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  }
}
