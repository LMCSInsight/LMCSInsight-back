import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import {
  queueFiltersSchema,
  historyFiltersSchema,
  getValidationQueue,
  getValidationHistory,
  getValidationStats,
} from '../services/validation.js'

export function validationRoutes(app: Application) {
  app.get(
    '/api/v1/validation/queue',
    requireAuth,
    requireRole('ASSISTANT', 'DIRECTOR'),
    async (req: Request, res: Response) => {
      try {
        const filters = queueFiltersSchema.parse(req.query)
        const result = await getValidationQueue(filters)
        res.json(result)
      } catch (err: unknown) {
        console.error('error fetching validation queue', err)
        res.status(400).json({ error: 'BAD_REQUEST' })
      }
    },
  )

  app.get(
    '/api/v1/validation/stats',
    requireAuth,
    requireRole('ASSISTANT', 'DIRECTOR'),
    async (req: Request, res: Response) => {
      try {
        const stats = await getValidationStats(req.user!.id)
        res.json(stats)
      } catch (err: unknown) {
        console.error('error fetching validation stats', err)
        res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
      }
    },
  )

  app.get(
    '/api/v1/validation/history',
    requireAuth,
    requireRole('ASSISTANT', 'DIRECTOR'),
    async (req: Request, res: Response) => {
      try {
        const filters = historyFiltersSchema.parse(req.query)
        const result = await getValidationHistory({
          ...filters,
          validatorId: req.user!.id,
        })
        res.json(result)
      } catch (err: unknown) {
        console.error('error fetching validation history', err)
        res.status(400).json({ error: 'BAD_REQUEST' })
      }
    },
  )
}
