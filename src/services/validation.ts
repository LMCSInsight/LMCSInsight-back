import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const validateSchema = z.object({
  comments: z.string().max(2000).optional(),
  fieldsChecked: z.record(z.boolean()).optional(),
})

export const rejectSchema = z.object({
  comments: z.string().min(1, 'Comments required').max(2000),
  issues: z.array(z.string()).min(1, 'At least one issue required'),
})

export const reviseSchema = z.object({
  comments: z.string().min(1, 'Comments required').max(2000),
  issues: z.array(z.string()).min(1, 'At least one issue required'),
})

export const queueFiltersSchema = z.object({
  status: z.enum(['PENDING', 'VALIDATED', 'REJECTED', 'REVISED']).optional(),
  search: z.string().optional(),
  type: z.enum(['PFE', 'MASTER', 'PHD', 'INTERNSHIP', 'PROJECT']).optional(),
  academicYear: z.string().optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).catch(100).default(20),
})

export const historyFiltersSchema = z.object({
  status: z.enum(['PENDING', 'VALIDATED', 'REJECTED', 'REVISED']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).catch(100).default(20),
})

// ─── Service functions ─────────────────────────────────────────────────────────

export async function getValidationQueue(params: {
  status?: string
  search?: string
  type?: string
  academicYear?: string
  page?: number
  limit?: number
}) {
  const {
    status = 'PENDING',
    search,
    type,
    academicYear,
    page = 1,
    limit = 20,
  } = params

  const where = {
    validationStatus: status as
      | 'PENDING'
      | 'VALIDATED'
      | 'REJECTED'
      | 'REVISED',
    ...(type && {
      type: type as 'PFE' | 'MASTER' | 'PHD' | 'INTERNSHIP' | 'PROJECT',
    }),
    ...(academicYear && { academicYear }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        {
          student: {
            firstName: { contains: search, mode: 'insensitive' as const },
          },
        },
        {
          student: {
            lastName: { contains: search, mode: 'insensitive' as const },
          },
        },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.supervision.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        student: true,
        supervisors: { include: { supervisor: true } },
        theme: true,
        validations: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    prisma.supervision.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function validateSupervision(params: {
  supervisionId: string
  validatorId: string
  comments?: string
  fieldsChecked?: Record<string, boolean>
}) {
  const { supervisionId, validatorId, comments, fieldsChecked } = params

  return prisma.$transaction(async (tx) => {
    const supervision = await tx.supervision.update({
      where: { id: supervisionId },
      data: {
        validationStatus: 'VALIDATED',
        validatedAt: new Date(),
        validationNotes: comments ?? null,
      },
      include: {
        student: true,
        supervisors: { include: { supervisor: true } },
        theme: true,
        validations: { orderBy: { createdAt: 'desc' } },
      },
    })

    await tx.validationLog.create({
      data: {
        supervisionId,
        validatorId,
        status: 'VALIDATED',
        comments: comments ?? null,
        fieldsChecked: fieldsChecked
          ? (fieldsChecked as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        issues: Prisma.JsonNull,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'VALIDATE',
        entityType: 'SUPERVISION',
        entityId: supervisionId,
        userId: validatorId,
        supervisionId,
      },
    })

    return supervision
  })
}

export async function rejectSupervision(params: {
  supervisionId: string
  validatorId: string
  comments: string
  issues: string[]
}) {
  const { supervisionId, validatorId, comments, issues } = params

  return prisma.$transaction(async (tx) => {
    const supervision = await tx.supervision.update({
      where: { id: supervisionId },
      data: {
        validationStatus: 'REJECTED',
        validatedAt: new Date(),
        validationNotes: comments,
      },
      include: {
        student: true,
        supervisors: { include: { supervisor: true } },
        theme: true,
        validations: { orderBy: { createdAt: 'desc' } },
      },
    })

    await tx.validationLog.create({
      data: {
        supervisionId,
        validatorId,
        status: 'REJECTED',
        comments,
        fieldsChecked: Prisma.JsonNull,
        issues: issues as Prisma.InputJsonValue,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'REJECT',
        entityType: 'SUPERVISION',
        entityId: supervisionId,
        userId: validatorId,
        supervisionId,
      },
    })

    return supervision
  })
}

export async function reviseSupervision(params: {
  supervisionId: string
  validatorId: string
  comments: string
  issues: string[]
}) {
  const { supervisionId, validatorId, comments, issues } = params

  return prisma.$transaction(async (tx) => {
    const supervision = await tx.supervision.update({
      where: { id: supervisionId },
      data: {
        validationStatus: 'REVISED',
        validatedAt: new Date(),
        validationNotes: comments,
      },
      include: {
        student: true,
        supervisors: { include: { supervisor: true } },
        theme: true,
        validations: { orderBy: { createdAt: 'desc' } },
      },
    })

    await tx.validationLog.create({
      data: {
        supervisionId,
        validatorId,
        status: 'REVISED',
        comments,
        fieldsChecked: Prisma.JsonNull,
        issues: issues as Prisma.InputJsonValue,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'REVISE',
        entityType: 'SUPERVISION',
        entityId: supervisionId,
        userId: validatorId,
        supervisionId,
      },
    })

    return supervision
  })
}

export async function getValidationHistory(params: {
  validatorId: string
  status?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}) {
  const { validatorId, status, from, to, page = 1, limit = 20 } = params

  const where = {
    validatorId,
    ...(status && {
      status: status as 'PENDING' | 'VALIDATED' | 'REJECTED' | 'REVISED',
    }),
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.validationLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        supervision: {
          select: {
            id: true,
            title: true,
            type: true,
            academicYear: true,
            validationStatus: true,
          },
        },
      },
    }),
    prisma.validationLog.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getValidationStats(validatorId: string) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  const [pending, validatedToday, rejectedThisWeek, revisedThisWeek, byType] =
    await Promise.all([
      prisma.supervision.count({ where: { validationStatus: 'PENDING' } }),
      prisma.validationLog.count({
        where: {
          validatorId,
          status: 'VALIDATED',
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.validationLog.count({
        where: {
          validatorId,
          status: 'REJECTED',
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.validationLog.count({
        where: {
          validatorId,
          status: 'REVISED',
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.supervision.groupBy({
        by: ['type'],
        where: { validationStatus: 'PENDING' },
        _count: { id: true },
      }),
    ])

  const byTypeMap = Object.fromEntries(byType.map((r) => [r.type, r._count.id]))

  return {
    pending,
    validatedToday,
    rejectedThisWeek,
    revisedThisWeek,
    byType: byTypeMap,
  }
}
