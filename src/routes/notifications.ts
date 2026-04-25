import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  getNotificationsForUser,
  markNotificationRead,
} from '../services/notifications.js'

const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Unexpected error'

export function notificationsRoutes(app: Application) {
  app.get(
    '/api/v1/notifications',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const notifications = await getNotificationsForUser(req.user!.id)
        res.json(notifications)
      } catch (err: unknown) {
        console.error('error fetching notifications', err)
        res.status(500).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.post(
    '/api/v1/notifications/:id/read',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        await markNotificationRead(req.params.id as string, req.user!.id)
        res.status(204).end()
      } catch (err: unknown) {
        console.error('error marking notification read', err)
        res.status(500).json({ error: getErrorMessage(err) })
      }
    },
  )
}
