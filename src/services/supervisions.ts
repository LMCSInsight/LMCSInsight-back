import { z } from 'zod'
import {
  SupervisionModel,
  SupervisionSupervisorModel,
} from '../db/models/index.js'

// --- SCHEMAS ---

export const createSupervisionSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  type: z.enum(['PFE', 'MASTER', 'PHD', 'INTERNSHIP', 'PROJECT']),
  description: z.string().optional(),
  status: z
    .enum(['IN_PROGRESS', 'DEFENDED', 'ABANDONED', 'EXTENSION', 'SUSPENDED'])
    .optional(),
  academicYear: z.string().min(1, { message: 'Academic year is required' }),
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
  academicYear: z.string().optional(),
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

// --- CRUD OPERATIONS ---

export async function createSupervision(input: CreateSupervisionInput) {
  const validated = createSupervisionSchema.parse(input)
  return SupervisionModel.create({
    data: validated,
  })
}

export interface GetSupervisionsOptions {
  type?: string
  status?: string
  validationStatus?: string
  academicYear?: string
  supervisorId?: string // chercheur_id
  search?: string // matches title or keywords
  page?: number
  limit?: number
}

export async function getSupervisions(options: GetSupervisionsOptions = {}) {
  const {
    type,
    status,
    validationStatus,
    academicYear,
    supervisorId,
    search,
    page = 1,
    limit = 20,
  } = options
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    ...(type && { type }),
    ...(status && { status }),
    ...(validationStatus && { validationStatus }),
    ...(academicYear && { academicYear }),
    ...(supervisorId && { supervisors: { some: { supervisorId } } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { keywords: { has: search } },
      ],
    }),
  }

  const include = {
    student: true,
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
  return SupervisionModel.update({
    where: { id },
    data: validated,
  })
}

export async function deleteSupervision(id: string) {
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
  return SupervisionSupervisorModel.create({
    data: {
      supervisionId,
      supervisorId: validated.supervisorId,
      isMainSupervisor: validated.isMainSupervisor ?? false,
      isExternal: validated.isExternal ?? false,
      contributionPercent: validated.contributionPercent ?? 100,
    },
  })
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
