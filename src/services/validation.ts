import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { notifyAllAssistants } from './notifications.js'

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * The main supervisor (reviewer) must be the chercheur linked to this user.
 */
export async function assertIsMainSupervisor(
  supervisionId: string,
  userId: string,
): Promise<void> {
  const row = await prisma.supervisionSupervisor.findFirst({
    where: {
      supervisionId,
      isMainSupervisor: true,
      supervisor: { user: { id: userId, isActive: true } },
    },
  })
  if (!row) {
    throw new Error('NOT_REVIEWER')
  }
}

const reviewerQueueFilter = (userId: string) => ({
  supervisors: {
    some: {
      isMainSupervisor: true,
      supervisor: { user: { id: userId } },
    },
  },
})

async function notifyAllAssistantsOfValidationDecision(
  supervisionId: string,
  validatorId: string,
  kind: 'VALIDATED' | 'REJECTED' | 'REVISED',
  details?: { comments?: string; issues?: string[] },
) {
  const [user, sup] = await Promise.all([
    prisma.user.findUnique({
      where: { id: validatorId },
      select: { firstName: true, lastName: true },
    }),
    prisma.supervision.findUnique({
      where: { id: supervisionId },
      select: { title: true },
    }),
  ])
  const reviewerName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    : 'A reviewer'
  const shortTitle = sup?.title ?? 'A supervision'
  const suffix =
    kind === 'VALIDATED'
      ? 'was validated'
      : kind === 'REJECTED'
        ? 'was rejected'
        : 'was marked to revise'
  const messageParts = [
    `by ${reviewerName}.`,
    details?.comments && details.comments.trim()
      ? ` ${details.comments.trim()}`
      : '',
  ]
  if (kind !== 'VALIDATED' && details?.issues?.length) {
    messageParts.push(` Issues: ${details.issues.join('; ')}`)
  }
  await notifyAllAssistants({
    type: 'VALIDATION_DECISION',
    title: `“${shortTitle}” ${suffix}`,
    message: `“${shortTitle}” ${suffix}${messageParts.join('')}`,
    supervisionId,
  })
}

// ─── Service functions ─────────────────────────────────────────────────────────

export type ValidationRole = 'RESEARCHER' | 'ASSISTANT' | 'DIRECTOR'

export async function getValidationQueue(params: {
  status?: string
  search?: string
  type?: string
  academicYear?: string
  page?: number
  limit?: number
  role: ValidationRole
  userId: string
}) {
  const {
    status = 'PENDING',
    search,
    type,
    academicYear,
    page = 1,
    limit = 20,
    role,
    userId,
  } = params

  const andConditions: Prisma.SupervisionWhereInput[] = [
    {
      validationStatus: status as
        | 'PENDING'
        | 'VALIDATED'
        | 'REJECTED'
        | 'REVISED',
    },
  ]

  if (type) {
    andConditions.push({
      type: type as 'PFE' | 'MASTER' | 'PHD' | 'INTERNSHIP' | 'PROJECT',
    })
  }
  if (academicYear) {
    andConditions.push({ academicYear })
  }
  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        {
          student: {
            firstName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          student: {
            lastName: { contains: search, mode: 'insensitive' },
          },
        },
      ],
    })
  }

  if (role === 'RESEARCHER') {
    andConditions.push(reviewerQueueFilter(userId))
  }

  const where: Prisma.SupervisionWhereInput = { AND: andConditions }

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
  await assertIsMainSupervisor(supervisionId, validatorId)

  const supervision = await prisma.$transaction(async (tx) => {
    const sup = await tx.supervision.update({
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

    return sup
  })

  await notifyAllAssistantsOfValidationDecision(
    supervisionId,
    validatorId,
    'VALIDATED',
    { comments },
  )

  return supervision
}

export async function rejectSupervision(params: {
  supervisionId: string
  validatorId: string
  comments: string
  issues: string[]
}) {
  const { supervisionId, validatorId, comments, issues } = params
  await assertIsMainSupervisor(supervisionId, validatorId)

  const supervision = await prisma.$transaction(async (tx) => {
    const sup = await tx.supervision.update({
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

    return sup
  })

  await notifyAllAssistantsOfValidationDecision(
    supervisionId,
    validatorId,
    'REJECTED',
    { comments, issues },
  )

  return supervision
}

export async function reviseSupervision(params: {
  supervisionId: string
  validatorId: string
  comments: string
  issues: string[]
}) {
  const { supervisionId, validatorId, comments, issues } = params
  await assertIsMainSupervisor(supervisionId, validatorId)

  const supervision = await prisma.$transaction(async (tx) => {
    const sup = await tx.supervision.update({
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

    return sup
  })

  await notifyAllAssistantsOfValidationDecision(
    supervisionId,
    validatorId,
    'REVISED',
    { comments, issues },
  )

  return supervision
}

export async function getValidationHistory(params: {
  validatorId?: string
  role: ValidationRole
  status?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}) {
  const { validatorId, role, status, from, to, page = 1, limit = 20 } = params

  const where: Prisma.ValidationLogWhereInput = {
    ...(role === 'RESEARCHER' && validatorId ? { validatorId } : {}),
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
        validator: { select: { firstName: true, lastName: true, id: true } },
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

export async function getValidationStats(userId: string, role: ValidationRole) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  if (role === 'RESEARCHER') {
    const myPendingWhere: Prisma.SupervisionWhereInput = {
      validationStatus: 'PENDING',
      ...reviewerQueueFilter(userId),
    }
    const [pending, validatedToday, rejectedThisWeek, revisedThisWeek, byType] =
      await Promise.all([
        prisma.supervision.count({ where: myPendingWhere }),
        prisma.validationLog.count({
          where: {
            validatorId: userId,
            status: 'VALIDATED',
            createdAt: { gte: startOfDay },
          },
        }),
        prisma.validationLog.count({
          where: {
            validatorId: userId,
            status: 'REJECTED',
            createdAt: { gte: startOfWeek },
          },
        }),
        prisma.validationLog.count({
          where: {
            validatorId: userId,
            status: 'REVISED',
            createdAt: { gte: startOfWeek },
          },
        }),
        prisma.supervision.groupBy({
          by: ['type'],
          where: myPendingWhere,
          _count: { id: true },
        }),
      ])

    const byTypeMap = Object.fromEntries(
      byType.map((r) => [r.type, r._count.id]),
    )
    return {
      pending,
      validatedToday,
      rejectedThisWeek,
      revisedThisWeek,
      byType: byTypeMap,
    }
  }

  // ASSISTANT, DIRECTOR — org-wide
  const [pending, validatedToday, rejectedThisWeek, revisedThisWeek, byType] =
    await Promise.all([
      prisma.supervision.count({ where: { validationStatus: 'PENDING' } }),
      prisma.validationLog.count({
        where: { status: 'VALIDATED', createdAt: { gte: startOfDay } },
      }),
      prisma.validationLog.count({
        where: { status: 'REJECTED', createdAt: { gte: startOfWeek } },
      }),
      prisma.validationLog.count({
        where: { status: 'REVISED', createdAt: { gte: startOfWeek } },
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
