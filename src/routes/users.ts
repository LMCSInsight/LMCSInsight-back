import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  getUserStats,
  resetUserPassword,
  resetPasswordSchema,
  toggleUserStatus,
  updateUser,
} from '../services/users.js'

export function usersRoutes(app: Application) {
  // All user management endpoints are admin-only
  const adminOnly = [requireAuth, requireRole('ADMIN')]

  // GET /api/v1/users/stats -- must be before /:id to avoid conflict
  app.get(
    '/api/v1/users/stats',
    ...adminOnly,
    async (_req: Request, res: Response) => {
      try {
        const stats = await getUserStats()
        return res.status(200).json(stats)
      } catch (err) {
        console.error('error fetching user stats', err)
        return res.status(500).end()
      }
    },
  )

  // GET /api/v1/users
  app.get(
    '/api/v1/users',
    ...adminOnly,
    async (req: Request, res: Response) => {
      try {
        const { search, role, isActive, page, limit } = req.query
        const users = await getUsers({
          search: search as string | undefined,
          role: role as
            | 'ADMIN'
            | 'DIRECTOR'
            | 'RESEARCHER'
            | 'ASSISTANT'
            | undefined,
          isActive: isActive !== undefined ? isActive === 'true' : undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        })
        return res.status(200).json(users)
      } catch (err) {
        console.error('error fetching users', err)
        return res.status(500).end()
      }
    },
  )

  // POST /api/v1/users
  app.post(
    '/api/v1/users',
    ...adminOnly,
    async (req: Request, res: Response) => {
      try {
        const user = await createUser(req.body)
        return res.status(201).json(user)
      } catch (err) {
        console.error('error creating user', err)
        return res.status(500).end()
      }
    },
  )

  // GET /api/v1/users/:id
  app.get(
    '/api/v1/users/:id',
    ...adminOnly,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        const user = await getUserById(id)
        if (user === null)
          return res.status(404).json({ error: 'USER_NOT_FOUND' })
        return res.status(200).json(user)
      } catch (err) {
        console.error('error fetching user by id', err)
        return res.status(500).end()
      }
    },
  )

  // PUT /api/v1/users/:id (fixed typo: was /user/:id)
  app.put(
    '/api/v1/users/:id',
    ...adminOnly,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        const user = await updateUser(id, req.body)
        return res.status(200).json(user)
      } catch (err) {
        console.error('error updating user', err)
        return res.status(500).end()
      }
    },
  )

  // PATCH /api/v1/users/:id/status -- toggle isActive
  app.patch(
    '/api/v1/users/:id/status',
    ...adminOnly,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        const user = await toggleUserStatus(id)
        return res.status(200).json(user)
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
          return res.status(404).json({ error: 'USER_NOT_FOUND' })
        }
        console.error('error toggling user status', err)
        return res.status(500).end()
      }
    },
  )

  // POST /api/v1/users/:id/reset-password
  app.post(
    '/api/v1/users/:id/reset-password',
    ...adminOnly,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        const parsed = resetPasswordSchema.safeParse(req.body)
        if (!parsed.success) {
          return res
            .status(400)
            .json({ error: 'VALIDATION_ERROR', details: parsed.error.issues })
        }
        const user = await resetUserPassword(id, parsed.data.password)
        return res.status(200).json(user)
      } catch (err) {
        console.error('error resetting user password', err)
        return res.status(500).end()
      }
    },
  )

  // DELETE /api/v1/users/:id
  app.delete(
    '/api/v1/users/:id',
    ...adminOnly,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        await deleteUser(id)
        return res.status(204).end()
      } catch (err) {
        console.error('error deleting user', err)
        return res.status(500).end()
      }
    },
  )
}
