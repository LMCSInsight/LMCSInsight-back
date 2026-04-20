import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../db/prisma.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenUtils.js'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const payload = { id: user.id, email: user.email, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  const { password: _pw, ...safeUser } = user
  void _pw
  const name = `${safeUser.firstName} ${safeUser.lastName}`.trim()

  return {
    user: { ...safeUser, name },
    accessToken,
    refreshToken,
  }
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken)
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, isActive: true },
  })
  if (!user || !user.isActive) throw new Error('INVALID_CREDENTIALS')

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })
  return { accessToken }
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phoneNumber: true,
      isActive: true,
    },
  })
  if (!user) throw new Error('NOT_FOUND')
  const name = `${user.firstName} ${user.lastName}`.trim()
  return { ...user, name }
}
