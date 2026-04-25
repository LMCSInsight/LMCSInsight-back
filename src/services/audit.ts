import { prisma } from '../db/prisma.js'

export async function audit(params: {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  changes?: object
  supervisionId?: string
  ipAddress?: string
  userAgent?: string
}) {
  return prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes ?? undefined,
      supervisionId: params.supervisionId,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}
