import { z } from 'zod'
import {
  SupervisionModel,
  SupervisionSupervisorModel,
} from '../db/models/index.js'
import { prisma } from '../db/prisma.js'
import { notify } from './notifications.js'
import {
  logSmtpFailureHint,
  resolveSupervisorMailRecipient,
  sendSupervisionAssignedEmail,
} from './email.js'

// --- SCHEMAS ---

export const createSupervisionSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  type: z.enum(['PFE', 'MASTER', 'PHD', 'INTERNSHIP', 'PROJECT']),
  description: z.string().optional(),
  status: z
    .enum(['IN_PROGRESS', 'DEFENDED', 'ABANDONED', 'EXTENSION', 'SUSPENDED'])
    .optional(),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, {
    message: 'Academic year must be in format YYYY-YYYY',
  }),
  startDate: z.string().transform((str) => new Date(str)),
  expectedEndDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  keywords: z.array(z.string()).optional(),
  studentId: z.string().min(1, { message: 'studentId is required' }),
  themeId: z.string().optional(),
})

export type CreateSupervisionInput = z.input<typeof createSupervisionSchema>

export const updateSupervisionSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['PFE', 'MASTER', 'PHD', 'INTERNSHIP', 'PROJECT']).optional(),
  description: z.string().optional(),
  status: z
    .enum(['IN_PROGRESS', 'DEFENDED', 'ABANDONED', 'EXTENSION', 'SUSPENDED'])
    .optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, {
      message: 'Academic year must be in format YYYY-YYYY',
    })
    .optional(),
  startDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  expectedEndDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  actualEndDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  keywords: z.array(z.string()).optional(),
  studentId: z.string().optional(),
  themeId: z.string().optional(),
})

export type UpdateSupervisionInput = z.input<typeof updateSupervisionSchema>

export const assignSupervisorSchema = z.object({
  supervisorId: z.string().min(1, { message: 'supervisorId is required' }),
  isMainSupervisor: z.boolean().optional(),
  isExternal: z.boolean().optional(),
  contributionPercent: z.number().optional(),
})

export type AssignSupervisorInput = z.input<typeof assignSupervisorSchema>

export const replaceSupervisionSupervisorsSchema = z.object({
  supervisors: z
    .array(
      z.object({
        supervisorId: z
          .string()
          .min(1, { message: 'supervisorId is required' }),
        isMainSupervisor: z.boolean(),
        isExternal: z.boolean().optional().default(false),
        contributionPercent: z.number().int().min(0).max(100),
      }),
    )
    .min(1, { message: 'At least one supervisor is required' }),
})

export type ReplaceSupervisionSupervisorsInput = z.infer<
  typeof replaceSupervisionSupervisorsSchema
>

function scheduleSupervisionAssignedEmail(params: {
  supervisionId: string
  supervisorChercheurId: string
  supervisionTitle: string
}): void {
  void (async () => {
    try {
      const to = await resolveSupervisorMailRecipient(
        params.supervisorChercheurId,
      )
      if (!to) {
        return
      }
      await sendSupervisionAssignedEmail({
        to,
        supervisionTitle: params.supervisionTitle,
        supervisionId: params.supervisionId,
      })
    } catch (err) {
      console.error('[email] supervision assigned notification failed', err)
      logSmtpFailureHint(err)
    }
  })()
}

// --- CRUD OPERATIONS ---

export async function createSupervision(
  input: CreateSupervisionInput,
  creatorUserId: string,
) {
  const validated = createSupervisionSchema.parse(input)
  // Assistants create bare supervisions: no auto supervisor row; PENDING; no broad assistant notify
  return prisma.supervision.create({
    data: {
      ...validated,
      submittedByUserId: creatorUserId,
    },
  })
}

export interface GetSupervisionsOptions {
  type?: string
  status?: string
  validationStatus?: string
  academicYear?: string
  studentId?: string
  supervisorId?: string // chercheur_id
  search?: string // matches title or keywords
  page?: number
  limit?: number
  /** Filter to supervisions created by this user (e.g. assistant "my submissions"). */
  submittedByUserId?: string
}

export async function getSupervisions(options: GetSupervisionsOptions = {}) {
  const {
    type,
    status,
    validationStatus,
    academicYear,
    studentId,
    supervisorId,
    search,
    page = 1,
    limit = 20,
    submittedByUserId,
  } = options
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    ...(type && { type }),
    ...(status && { status }),
    ...(validationStatus && { validationStatus }),
    ...(academicYear && { academicYear }),
    ...(studentId && { studentId }),
    ...(supervisorId && { supervisors: { some: { supervisorId } } }),
    ...(submittedByUserId && { submittedByUserId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { keywords: { has: search } },
      ],
    }),
  }

  const include = {
    student: true,
    theme: true,
    supervisors: { include: { supervisor: true } },
  }

  const [data, total] = await Promise.all([
    SupervisionModel.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),
    SupervisionModel.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getSupervisionById(id: string) {
  return SupervisionModel.findUnique({
    where: { id },
    include: {
      student: true,
      theme: true,
      supervisors: { include: { supervisor: true } },
      validations: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function updateSupervision(
  id: string,
  input: UpdateSupervisionInput,
) {
  const validated = updateSupervisionSchema.parse(input)

  const current = await prisma.supervision.findUnique({
    where: { id },
    select: { validationStatus: true, title: true },
  })
  if (!current) {
    throw new Error('NOT_FOUND')
  }

  const vs = current.validationStatus

  if (vs === 'VALIDATED') {
    throw new Error('VALIDATED_LOCKED')
  }

  if (vs === 'PENDING') {
    return SupervisionModel.update({
      where: { id },
      data: validated,
      include: {
        student: true,
        theme: true,
        supervisors: { include: { supervisor: true } },
      },
    })
  }

  // REVISED: saving edits = resubmit for main supervisor review
  if (vs === 'REVISED') {
    const updated = await prisma.$transaction(async (tx) => {
      const sup = await tx.supervision.update({
        where: { id },
        data: {
          ...validated,
          validationStatus: 'PENDING',
          validatedAt: null,
          validationNotes: null,
        },
        include: {
          student: true,
          theme: true,
          supervisors: { include: { supervisor: true } },
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'RESUBMIT',
          entityType: 'SUPERVISION',
          entityId: id,
          userId: null,
          supervisionId: id,
        },
      })

      return sup
    })

    // Notify main supervisor (reviewer) for resubmission
    const ss = await prisma.supervisionSupervisor.findFirst({
      where: { supervisionId: id, isMainSupervisor: true },
      include: { supervisor: { include: { user: true } } },
    })
    const u = ss?.supervisor.user
    if (u?.id && u.isActive) {
      const title = 'Supervision resubmitted for review'
      const message = `“${updated.title}” was revised and resubmitted.`
      await notify({
        recipientId: u.id,
        type: 'RESUBMISSION',
        title,
        message,
        supervisionId: id,
      })
    }

    return updated
  }

  return SupervisionModel.update({
    where: { id },
    data: validated,
    include: {
      student: true,
      theme: true,
      supervisors: { include: { supervisor: true } },
    },
  })
}

export async function deleteSupervision(id: string) {
  const current = await prisma.supervision.findUnique({
    where: { id },
    select: { validationStatus: true },
  })
  if (!current) {
    throw new Error('NOT_FOUND')
  }
  if (current.validationStatus === 'VALIDATED') {
    throw new Error('SUPERVISION_NOT_DELETABLE')
  }
  return SupervisionModel.delete({
    where: { id },
  })
}

// --- SUPERVISOR ASSIGNMENT OPERATIONS ---

export async function assignSupervisor(
  supervisionId: string,
  input: AssignSupervisorInput,
) {
  const validated = assignSupervisorSchema.parse(input)
  const existing = await SupervisionSupervisorModel.findFirst({
    where: {
      supervisionId,
      supervisorId: validated.supervisorId,
    },
  })
  if (existing) {
    return existing
  }

  const assignment = await SupervisionSupervisorModel.create({
    data: {
      supervisionId,
      supervisorId: validated.supervisorId,
      isMainSupervisor: validated.isMainSupervisor ?? false,
      isExternal: validated.isExternal ?? false,
      contributionPercent: validated.contributionPercent ?? 100,
    },
  })

  const all = await SupervisionSupervisorModel.findMany({
    where: { supervisionId },
    select: { contributionPercent: true },
  })
  const total = all.reduce((sum, s) => sum + s.contributionPercent, 0)
  if (total !== 100) {
    await SupervisionSupervisorModel.delete({ where: { id: assignment.id } })
    throw new Error(
      `Contribution percentages must sum to 100 (current total: ${total})`,
    )
  }

  const supForNotify = await prisma.supervision.findUnique({
    where: { id: supervisionId },
    select: { title: true },
  })
  const supervisionTitle = supForNotify?.title ?? 'A supervision'

  if (validated.isMainSupervisor) {
    const chercheur = await prisma.chercheur.findUnique({
      where: { chercheur_id: validated.supervisorId },
      include: { user: { select: { id: true, isActive: true } } },
    })
    const u = chercheur?.user
    if (u?.id && u.isActive) {
      const title = 'New supervision awaits your review'
      const message = `“${supervisionTitle}” was assigned to you for review.`
      await notify({
        recipientId: u.id,
        type: 'NEW_SUBMISSION',
        title,
        message,
        supervisionId,
      })
    }
  }

  scheduleSupervisionAssignedEmail({
    supervisionId,
    supervisorChercheurId: validated.supervisorId,
    supervisionTitle,
  })

  return assignment
}

/**
 * Replaces all supervisors in one transaction so contribution percentages can sum
 * to 100 (the single-step assign API validates total after each insert and cannot
 * add a second co-supervisor with split shares).
 */
export async function replaceSupervisionSupervisors(
  supervisionId: string,
  input: ReplaceSupervisionSupervisorsInput,
) {
  const { supervisors: rows } = replaceSupervisionSupervisorsSchema.parse(input)

  const current = await prisma.supervision.findUnique({
    where: { id: supervisionId },
    select: { validationStatus: true, title: true },
  })
  if (!current) {
    throw new Error('NOT_FOUND')
  }
  if (current.validationStatus === 'VALIDATED') {
    throw new Error('VALIDATED_LOCKED')
  }

  const mains = rows.filter((r) => r.isMainSupervisor)
  if (mains.length !== 1) {
    throw new Error('Exactly one main supervisor is required')
  }
  const idSet = new Set(rows.map((r) => r.supervisorId))
  if (idSet.size !== rows.length) {
    throw new Error('Duplicate supervisor in list')
  }
  const total = rows.reduce((s, r) => s + r.contributionPercent, 0)
  if (total !== 100) {
    throw new Error(
      `Contribution percentages must sum to 100 (current total: ${total})`,
    )
  }

  const oldMain = await SupervisionSupervisorModel.findFirst({
    where: { supervisionId, isMainSupervisor: true },
    select: { supervisorId: true },
  })

  const previousSupervisorRows = await SupervisionSupervisorModel.findMany({
    where: { supervisionId },
    select: { supervisorId: true },
  })
  const previousSupervisorIds = new Set(
    previousSupervisorRows.map((r) => r.supervisorId),
  )

  await prisma.$transaction(async (tx) => {
    await tx.supervisionSupervisor.deleteMany({ where: { supervisionId } })
    await tx.supervisionSupervisor.createMany({
      data: rows.map((r) => ({
        supervisionId,
        supervisorId: r.supervisorId,
        isMainSupervisor: r.isMainSupervisor,
        isExternal: r.isExternal,
        contributionPercent: r.contributionPercent,
      })),
    })
  })

  const newMainId = rows.find((r) => r.isMainSupervisor)!.supervisorId
  if (oldMain?.supervisorId !== newMainId) {
    const chercheur = await prisma.chercheur.findUnique({
      where: { chercheur_id: newMainId },
      include: { user: { select: { id: true, isActive: true } } },
    })
    const u = chercheur?.user
    if (u?.id && u.isActive) {
      const title = 'New supervision awaits your review'
      const message = `“${
        current.title ?? 'A supervision'
      }” was assigned to you for review.`
      await notify({
        recipientId: u.id,
        type: 'NEW_SUBMISSION',
        title,
        message,
        supervisionId,
      })
    }
  }

  const titleForEmail = current.title ?? 'A supervision'
  for (const row of rows) {
    if (!previousSupervisorIds.has(row.supervisorId)) {
      scheduleSupervisionAssignedEmail({
        supervisionId,
        supervisorChercheurId: row.supervisorId,
        supervisionTitle: titleForEmail,
      })
    }
  }

  return getSupervisionById(supervisionId)
}

export async function removeSupervisor(
  supervisionId: string,
  supervisorId: string,
) {
  return SupervisionSupervisorModel.deleteMany({
    where: {
      supervisionId,
      supervisorId,
    },
  })
}
