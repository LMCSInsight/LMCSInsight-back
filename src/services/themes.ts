import { z } from 'zod'
import { ThemeModel } from '../db/models/index.js'
import { prisma } from '../db/prisma.js'

const uuidLike = z.string().uuid({ message: 'Invalid id format' })

export const createThemeSchema = z.object({
  name: z.string().min(1, { message: 'name is required' }),
  description: z.string().optional(),
  teamId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => (v == null || v === '' ? undefined : v)),
})

export type CreateThemeInput = z.infer<typeof createThemeSchema>

export const updateThemeSchema = z.object({
  name: z.string().min(1, { message: 'name is required' }).optional(),
  description: z.string().optional().nullable(),
  teamId: z.union([z.string().uuid(), z.null()]).optional(),
})

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>

export interface GetThemesOptions {
  search?: string
  teamId?: string
  page?: number
  limit?: number
}

async function assertTeamExists(teamId: string) {
  const t = await prisma.team.findUnique({ where: { id: teamId } })
  if (!t) {
    throw new Error('TEAM_NOT_FOUND')
  }
}

export async function createTheme(input: CreateThemeInput) {
  const validated = createThemeSchema.parse(input)
  if (validated.teamId) {
    await assertTeamExists(validated.teamId)
  }
  return ThemeModel.create({
    data: {
      name: validated.name,
      description: validated.description,
      teamId: validated.teamId,
    },
    include: { team: true },
  })
}

export async function getThemes(options: GetThemesOptions = {}) {
  const { search, teamId, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    ...(teamId && { teamId }),
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
      include: { team: true },
    }),
    ThemeModel.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getThemeById(id: string) {
  uuidLike.parse(id)
  return ThemeModel.findUnique({
    where: { id },
    include: { team: true },
  })
}

export async function updateTheme(id: string, input: UpdateThemeInput) {
  uuidLike.parse(id)
  const validated = updateThemeSchema.parse(input)
  if (typeof validated.teamId === 'string' && validated.teamId) {
    await assertTeamExists(validated.teamId)
  }
  const data: {
    name?: string
    description?: string | null
    teamId?: string | null
  } = {}
  if (validated.name !== undefined) data.name = validated.name
  if (validated.description !== undefined)
    data.description = validated.description
  if (validated.teamId !== undefined) data.teamId = validated.teamId
  if (Object.keys(data).length === 0) {
    throw new Error('EMPTY_UPDATE')
  }
  return ThemeModel.update({
    where: { id },
    data,
    include: { team: true },
  })
}

export async function deleteTheme(id: string) {
  uuidLike.parse(id)
  return ThemeModel.delete({
    where: { id },
  })
}
