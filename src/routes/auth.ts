import type { Application, Request, Response } from 'express'
import { loginSchema, login, refresh, me } from '../services/auth.js'
import { requireAuth } from '../middleware/authMiddleware.js'

export function authRoutes(app: Application) {
  app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body)
      const result = await login(email, password)
      res.json(result)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        res.status(401).json({ error: 'INVALID_CREDENTIALS' })
        return
      }
      // Zod validation error
      res.status(400).json({ error: 'BAD_REQUEST' })
    }
  })

  app.post('/api/v1/auth/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) {
      res.status(400).json({ error: 'BAD_REQUEST' })
      return
    }
    try {
      const result = await refresh(refreshToken)
      res.json(result)
    } catch {
      res.status(401).json({ error: 'UNAUTHORIZED' })
    }
  })

  app.post('/api/v1/auth/logout', (_req: Request, res: Response) => {
    res.status(204).end()
  })

  app.get(
    '/api/v1/auth/me',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const user = await me(req.user!.id)
        res.json({ user })
      } catch {
        res.status(404).json({ error: 'NOT_FOUND' })
      }
    },
  )
}
