import { prisma } from '../db/prisma.js'
import type { NotificationType } from '@prisma/client'

/**
 * Resolves the main-supervisor chercheur to a user and sends a notification, if an active user exists.
 */
export async function notifyMainSupervisorUser(
  supervisionId: string,
  type: NotificationType,
  title: string,
  message: string,
): Promise<void> {
  const row = await prisma.supervisionSupervisor.findFirst({
    where: { supervisionId, isMainSupervisor: true },
    include: { supervisor: { include: { user: true } } },
  })
  const u = row?.supervisor.user
  if (u?.id && u.isActive) {
    await notify({ recipientId: u.id, type, title, message, supervisionId })
  }
}

export async function notify(params: {
  recipientId: string
  type: NotificationType
  title: string
  message: string
  supervisionId?: string
}) {
  return prisma.notification.create({
    data: {
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      supervisionId: params.supervisionId,
    },
  })
}

export async function notifyAllAssistants(params: {
  type: NotificationType
  title: string
  message: string
  supervisionId?: string
}) {
  const assistants = await prisma.user.findMany({
    where: { role: 'ASSISTANT', isActive: true },
    select: { id: true },
  })

  await Promise.all(
    assistants.map((a) => notify({ recipientId: a.id, ...params })),
  )
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      supervision: { select: { id: true, title: true } },
    },
  })
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, recipientId: userId },
    data: { readAt: new Date() },
  })
}
