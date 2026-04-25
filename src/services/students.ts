import { z } from 'zod'
import type { Institution, StudentLevel } from '@prisma/client'
import { StudentModel } from '../db/models/index.js'

export const createStudentSchema = z.object({
  firstName: z.string().min(1, { message: 'firstName is required' }),
  lastName: z.string().min(1, { message: 'lastName is required' }),
  email: z.string().email(),
  institution: z.enum(['ESI', 'EXTERNE']),
  level: z.enum(['MASTER', 'DOCTORANT']),
  specialty: z.enum(['SIL', 'SID', 'SIT', 'SIQ']).optional(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

export async function createStudent(input: CreateStudentInput) {
  // Validate and parse input
  const validated = createStudentSchema.parse(input)

  return StudentModel.create({
    data: validated,
  })
}

export interface GetStudentsOptions {
  search?: string
  institution?: Institution
  level?: StudentLevel
  page?: number
  limit?: number
}

export async function getStudents(options: GetStudentsOptions = {}) {
  const { search, institution, level, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const where = {
    ...(institution && { institution }),
    ...(level && { level }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    StudentModel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { lastName: 'asc' },
    }),
    StudentModel.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getStudentById(id: string) {
  return StudentModel.findUnique({
    where: { id },
    include: { supervisions: true },
  })
}

export async function updateStudent(
  id: string,
  input: Partial<CreateStudentInput>,
) {
  const validated = createStudentSchema.partial().parse(input)

  return StudentModel.update({
    where: { id },
    data: validated,
  })
}

export async function deleteStudent(id: string) {
  return StudentModel.delete({
    where: { id },
  })
}
