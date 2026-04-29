import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'

const caseInsensitive: Prisma.QueryMode = 'insensitive'

export interface GetChercheursOptions {
  search?: string
  page?: number
  limit?: number
}

/**
 * List active researchers (chercheurs) for assign-supervisor pickers.
 * `supervision_supervisors.supervisorId` references `chercheurs.chercheur_id`.
 */
export async function getChercheurs(options: GetChercheursOptions = {}) {
  const { search, page = 1, limit = 200 } = options
  const skip = (page - 1) * limit

  const where = {
    statut: 'Actif' as const,
    ...(search?.trim() && {
      OR: [
        { nom_complet: { contains: search.trim(), mode: caseInsensitive } },
        { chercheur_id: { contains: search.trim(), mode: caseInsensitive } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.chercheur.findMany({
      where,
      select: {
        chercheur_id: true,
        nom_complet: true,
        qualite: true,
        grade_recherche: true,
        mails: true,
        teams: {
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
      skip,
      take: limit,
      orderBy: { nom_complet: 'asc' },
    }),
    prisma.chercheur.count({ where }),
  ])

  return { data, total, page, limit }
}
