import { z } from 'zod'
import { StudentModel } from '../db/models/index.js'

export const createStudentSchema = z.object({
  firstName: z.string().min(1, { message: 'firstName is required' }),
  lastName: z.string().min(1, { message: 'lastName is required' }),
  email: z.string().email(),
  institution: z.string().min(1, { message: 'institution is required' }),
  level: z.string().min(1, { message: 'level is required' }),
  specialty: z.string().optional(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

export async function createStudent(input: CreateStudentInput) {
  // Validate and parse input
  const validated = createStudentSchema.parse(input)

  return StudentModel.create({
    data: validated,
  })
}

export async function getStudents() {
  return StudentModel.findMany()
}

export async function getStudentByIdId(id: string) {
  return StudentModel.findUnique({
    where: { id: id }
  })
}

export async function updateStudent(id : string, input: Partial<CreateStudentInput>) {
  const validated = createStudentSchema.partial().parse(input)

  return StudentModel.update({
    where: { id},
    data : validated,
  })
}

export async function deleteStudent(id: string) {
  return StudentModel.delete({
    where: { id }
  })
}