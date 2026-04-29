import { z } from 'zod'
import { ThemeModel } from '../db/models/index.js'

const uuidLike = z.string().uuid({ message: 'Invalid id format' })

export const createThemeSchema = z.object({
  name: z.string().min(1, { message: 'name is required' }),
  description: z.string().optional(),
})

export type CreateThemeInput = z.infer<typeof createThemeSchema>

export const updateThemeSchema = z.object({
  name: z.string().min(1, { message: 'name is required' }).optional(),
  description: z.string().optional().nullable(),
})

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>

export interface GetThemesOptions {
  search?: string
  page?: number
  limit?: number
}

export async function createTheme(input: CreateThemeInput) {
  const validated = createThemeSchema.parse(input)
  return ThemeModel.create({
    data: {
      name: validated.name,
      description: validated.description,
    },
    include: { _count: { select: { teams: true } } },
  })
}

export async function getThemes(options: GetThemesOptions = {}) {
  const { search, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        {
          description: { contains: search, mode: 'insensitive' as const },
        },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    ThemeModel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: { _count: { select: { teams: true } } },
    }),
    ThemeModel.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getThemeById(id: string) {
  uuidLike.parse(id)
  return ThemeModel.findUnique({
    where: { id },
    include: {
      teams: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
      _count: { select: { teams: true } },
    },
  })
}

export async function updateTheme(id: string, input: UpdateThemeInput) {
  uuidLike.parse(id)
  const validated = updateThemeSchema.parse(input)
  const data: {
    name?: string
    description?: string | null
  } = {}
  if (validated.name !== undefined) data.name = validated.name
  if (validated.description !== undefined)
    data.description = validated.description
  if (Object.keys(data).length === 0) {
    throw new Error('EMPTY_UPDATE')
  }
  return ThemeModel.update({
    where: { id },
    data,
    include: { _count: { select: { teams: true } } },
  })
}

export async function deleteTheme(id: string) {
  uuidLike.parse(id)
  return ThemeModel.delete({
    where: { id },
  })
}
