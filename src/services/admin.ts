import { prisma } from '../db/prisma.js'

export interface GetAuditLogsOptions {
  from?: string
  to?: string
  userId?: string
  action?: string
  entityType?: string
  page?: number
  limit?: number
}

export async function getAuditLogs(options: GetAuditLogsOptions = {}) {
  const { from, to, userId, action, entityType, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    }
  }
  if (userId) where.userId = userId
  if (action) where.action = action
  if (entityType) where.entityType = entityType

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getDashboardStats() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    totalUsers,
    usersByRole,
    activeUsers,
    totalSupervisions,
    supervisionsByValidationStatus,
    recentActivityCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.supervision.count({ where: { deletedAt: null } }),
    prisma.supervision.groupBy({
      by: ['validationStatus'],
      _count: { validationStatus: true },
      where: { deletedAt: null },
    }),
    prisma.auditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ])

  const roleMap: Record<string, number> = {}
  for (const row of usersByRole) {
    roleMap[row.role] = row._count.role
  }

  const validationMap: Record<string, number> = {}
  for (const row of supervisionsByValidationStatus) {
    validationMap[row.validationStatus] = row._count.validationStatus
  }

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: {
        ADMIN: roleMap['ADMIN'] ?? 0,
        DIRECTOR: roleMap['DIRECTOR'] ?? 0,
        RESEARCHER: roleMap['RESEARCHER'] ?? 0,
        ASSISTANT: roleMap['ASSISTANT'] ?? 0,
      },
    },
    supervisions: {
      total: totalSupervisions,
      byValidationStatus: {
        PENDING: validationMap['PENDING'] ?? 0,
        VALIDATED: validationMap['VALIDATED'] ?? 0,
        REJECTED: validationMap['REJECTED'] ?? 0,
        REVISED: validationMap['REVISED'] ?? 0,
      },
    },
    recentActivity: {
      count: recentActivityCount,
      periodDays: 7,
    },
  }
}
