import { z } from 'zod'
import { TeamModel } from '../db/models/index.js'
import { prisma } from '../db/prisma.js'

const uuidLike = z.string().uuid({ message: 'Invalid id format' })
const chercheurIdLike = z
  .string()
  .min(1, { message: 'Invalid chercheur id format' })

export const createTeamSchema = z.object({
  name: z.string().min(1, { message: 'name is required' }),
  description: z.string().optional(),
  themeId: z.string().uuid({ message: 'themeId is required' }),
  memberIds: z.array(chercheurIdLike).optional(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>

export const updateTeamSchema = z.object({
  name: z.string().min(1, { message: 'name is required' }).optional(),
  description: z.string().optional().nullable(),
  themeId: uuidLike.optional(),
  memberIds: z.array(chercheurIdLike).optional(),
})

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>

export interface GetTeamsOptions {
  search?: string
  page?: number
  limit?: number
}

async function assertThemeExists(themeId: string) {
  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
    select: { id: true },
  })
  if (!theme) throw new Error('THEME_NOT_FOUND')
}

export async function createTeam(input: CreateTeamInput) {
  const validated = createTeamSchema.parse(input)
  await assertThemeExists(validated.themeId)
  return TeamModel.create({
    data: {
      name: validated.name,
      description: validated.description,
      theme: { connect: { id: validated.themeId } },
      ...(validated.memberIds && validated.memberIds.length > 0
        ? {
            members: {
              connect: validated.memberIds.map((id) => ({ chercheur_id: id })),
            },
          }
        : {}),
    },
    include: {
      theme: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
  })
}

export async function getTeams(options: GetTeamsOptions = {}) {
  const { search, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    TeamModel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        theme: { select: { id: true, name: true } },
        members: {
          select: { chercheur_id: true, nom_complet: true },
          orderBy: { nom_complet: 'asc' },
        },
        _count: { select: { members: true } },
      },
    }),
    TeamModel.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getTeamById(id: string) {
  uuidLike.parse(id)
  return TeamModel.findUnique({
    where: { id },
    include: {
      theme: { select: { id: true, name: true } },
      _count: { select: { members: true } },
      members: {
        select: { chercheur_id: true, nom_complet: true },
        orderBy: { nom_complet: 'asc' },
      },
    },
  })
}

export async function updateTeam(id: string, input: UpdateTeamInput) {
  uuidLike.parse(id)
  const validated = updateTeamSchema.parse(input)

  if (validated.themeId !== undefined) {
    await assertThemeExists(validated.themeId)
  }

  const data: {
    name?: string
    description?: string | null
    theme?: { connect: { id: string } }
    members?: { set: Array<{ chercheur_id: string }> }
  } = {}
  if (validated.name !== undefined) data.name = validated.name
  if (validated.description !== undefined)
    data.description = validated.description
  if (validated.themeId !== undefined) {
    data.theme = { connect: { id: validated.themeId } }
  }
  if (validated.memberIds !== undefined) {
    data.members = {
      set: validated.memberIds.map((id) => ({ chercheur_id: id })),
    }
  }
  if (Object.keys(data).length === 0) throw new Error('EMPTY_UPDATE')

  return TeamModel.update({
    where: { id },
    data,
    include: {
      theme: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
  })
}

export async function deleteTeam(id: string) {
  uuidLike.parse(id)
  return TeamModel.delete({ where: { id } })
}
