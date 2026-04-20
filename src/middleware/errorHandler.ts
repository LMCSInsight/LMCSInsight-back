import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'NOT_FOUND' })
      return
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'CONFLICT' })
      return
    }
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
}
