import bcrypt from 'bcrypt'
import { z } from 'zod'

import { prisma } from '../db/prisma.js'
import { UserModel } from '../db/models/index.js'
import { getAppLoginUrl, sendNewUserCredentialsEmail } from './email.js'

const BCRYPT_ROUNDS = 12

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
  firstName: z.string().min(1, { message: 'firstName is required' }),
  lastName: z.string().min(1, { message: 'lastName is required' }),
  role: z.enum(['ADMIN', 'DIRECTOR', 'RESEARCHER', 'ASSISTANT']),
  phoneNumber: z.string().optional(),
})

/** @deprecated use createUserSchema */
export const createUserScehma = createUserSchema

export type CreateUserInput = z.infer<typeof createUserSchema>

/**
 * Generate a sequential chercheur_id for newly created researchers.
 * Format: MAT + 3-digit serial number (e.g., MAT001, MAT002, MAT003)
 */
async function generateChercheurId(): Promise<string> {
  // Find all existing MAT-format chercheur_ids
  const existing = await prisma.chercheur.findMany({
    where: {
      chercheur_id: {
        startsWith: 'MAT',
      },
    },
    select: {
      chercheur_id: true,
    },
  })

  // Extract the highest number
  let maxNumber = 0
  existing.forEach((c) => {
    const num = parseInt(c.chercheur_id.replace('MAT', ''), 10)
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num
    }
  })

  // Generate next number with zero padding
  const nextNumber = maxNumber + 1
  return `MAT${String(nextNumber).padStart(3, '0')}`
}

export async function createUser(input: CreateUserInput) {
  const validated = createUserSchema.parse(input)
  const hashedPassword = await bcrypt.hash(validated.password, BCRYPT_ROUNDS)

  // Generate chercheur_id outside transaction if needed
  let chercheurId: string | undefined
  if (validated.role === 'RESEARCHER') {
    chercheurId = await generateChercheurId()
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { ...validated, password: hashedPassword },
    })

    if (validated.role === 'RESEARCHER' && chercheurId) {
      await tx.chercheur.upsert({
        where: { chercheur_id: chercheurId },
        update: {
          nom_complet: [validated.firstName, validated.lastName]
            .filter(Boolean)
            .join(' '),
          mails: [validated.email],
          qualite: 'Enseignant_Chercheur',
          statut: 'Actif',
        },
        create: {
          chercheur_id: chercheurId,
          nom_complet: [validated.firstName, validated.lastName]
            .filter(Boolean)
            .join(' '),
          mails: [validated.email],
          qualite: 'Enseignant_Chercheur',
          statut: 'Actif',
        },
      })

      return tx.user.update({
        where: { id: createdUser.id },
        data: { chercheur_id: chercheurId },
      })
    }

    return createdUser
  })

  const loginUrl = getAppLoginUrl()
  void (async () => {
    try {
      await sendNewUserCredentialsEmail({
        to: validated.email,
        firstName: validated.firstName,
        email: validated.email,
        password: validated.password,
        loginUrl,
      })
    } catch (err) {
      console.error('[email] new user credentials email failed', err)
    }
  })()
  return user
}

export interface GetUsersOptions {
  search?: string
  role?: 'ADMIN' | 'DIRECTOR' | 'RESEARCHER' | 'ASSISTANT'
  isActive?: boolean
  page?: number
  limit?: number
}

export async function getUsers(options: GetUsersOptions = {}) {
  const { search, role, isActive, page = 1, limit = 20 } = options
  const skip = (page - 1) * limit

  const where = {
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    UserModel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { lastName: 'asc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    UserModel.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getUserById(id: string) {
  return UserModel.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phoneNumber: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function updateUser(id: string, input: Partial<CreateUserInput>) {
  const validated = createUserSchema.partial().parse(input)
  const existingUser = await UserModel.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  })

  if (!existingUser) {
    return null
  }

  if (validated.password) {
    validated.password = await bcrypt.hash(validated.password, BCRYPT_ROUNDS)
  }

  const nextRole = validated.role ?? existingUser.role
  let chercheurIdForUpdate: string | null = null

  if (nextRole === 'RESEARCHER') {
    const existingChercheurId = await UserModel.findUnique({
      where: { id },
      select: { chercheur_id: true },
    }).then((u) => u?.chercheur_id)
    chercheurIdForUpdate = existingChercheurId ?? (await generateChercheurId())
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: validated,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (nextRole === 'RESEARCHER' && chercheurIdForUpdate) {
      await tx.chercheur.upsert({
        where: { chercheur_id: chercheurIdForUpdate },
        update: {
          nom_complet: [
            validated.firstName ?? existingUser.firstName,
            validated.lastName ?? existingUser.lastName,
          ]
            .filter(Boolean)
            .join(' '),
          mails: [validated.email ?? existingUser.email],
          qualite: 'Enseignant_Chercheur',
          statut: 'Actif',
        },
        create: {
          chercheur_id: chercheurIdForUpdate,
          nom_complet: [
            validated.firstName ?? existingUser.firstName,
            validated.lastName ?? existingUser.lastName,
          ]
            .filter(Boolean)
            .join(' '),
          mails: [validated.email ?? existingUser.email],
          qualite: 'Enseignant_Chercheur',
          statut: 'Actif',
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: { chercheur_id: chercheurIdForUpdate },
      })
    }

    return user
  })

  return updatedUser
}

export async function toggleUserStatus(id: string) {
  const user = await UserModel.findUnique({
    where: { id },
    select: { isActive: true },
  })
  if (!user) throw new Error('USER_NOT_FOUND')

  return UserModel.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  })
}

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
})

export async function resetUserPassword(id: string, newPassword: string) {
  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  return UserModel.update({
    where: { id },
    data: { password: hashed },
    select: { id: true, email: true },
  })
}

export async function getUserStats() {
  const [total, byRole, activeCount] = await Promise.all([
    UserModel.count(),
    UserModel.groupBy({ by: ['role'], _count: { role: true } }),
    UserModel.count({ where: { isActive: true } }),
  ])

  const roleMap: Record<string, number> = {}
  for (const row of byRole) {
    roleMap[row.role] = row._count.role
  }

  return {
    total,
    active: activeCount,
    inactive: total - activeCount,
    byRole: {
      ADMIN: roleMap['ADMIN'] ?? 0,
      DIRECTOR: roleMap['DIRECTOR'] ?? 0,
      RESEARCHER: roleMap['RESEARCHER'] ?? 0,
      ASSISTANT: roleMap['ASSISTANT'] ?? 0,
    },
  }
}

export async function deleteUser(id: string) {
  return UserModel.delete({ where: { id } })
}
