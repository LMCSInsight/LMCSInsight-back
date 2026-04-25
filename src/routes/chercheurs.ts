import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { getChercheurs } from '../services/chercheurs.js'

export function chercheursRoutes(app: Application) {
  app.get(
    '/api/v1/chercheurs',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { search, page, limit } = req.query
        const result = await getChercheurs({
          search: search as string | undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        })
        return res.json(result)
      } catch (err) {
        console.error('error listing chercheurs', err)
        return res.status(500).end()
      }
    },
  )
}
