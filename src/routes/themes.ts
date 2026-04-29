import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import {
  createTheme,
  deleteTheme,
  getThemeById,
  getThemes,
  updateTheme,
} from '../services/themes.js'

const writeAuth = [requireAuth, requireRole('ASSISTANT', 'ADMIN')]

export function themesRoutes(app: Application) {
  app.post(
    '/api/v1/themes',
    ...writeAuth,
    async (req: Request, res: Response) => {
      try {
        const theme = await createTheme(req.body)
        return res.status(201).json(theme)
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err)
        console.error('error creating theme', err)
        return res.status(400).json({ error: m || 'create failed' })
      }
    },
  )

  app.get(
    '/api/v1/themes',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { search, page, limit } = req.query
        const result = await getThemes({
          search: search as string | undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        })
        return res.json(result)
      } catch (err) {
        console.error('error listing themes', err)
        return res.status(500).end()
      }
    },
  )

  app.get(
    '/api/v1/themes/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        const theme = await getThemeById(id)
        if (theme === null) return res.status(404).end()
        return res.json(theme)
      } catch (err) {
        console.error('error fetching theme', err)
        return res.status(400).json({ error: 'Invalid request' })
      }
    },
  )

  app.put(
    '/api/v1/themes/:id',
    ...writeAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        const theme = await updateTheme(id, req.body)
        return res.json(theme)
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err)
        if (m === 'EMPTY_UPDATE') {
          return res.status(400).json({ error: m })
        }
        if (
          (err as { code?: string })?.code === 'P2025' &&
          m.includes('Record to update not found')
        ) {
          return res.status(404).end()
        }
        console.error('error updating theme', err)
        return res.status(400).json({ error: m || 'update failed' })
      }
    },
  )

  app.delete(
    '/api/v1/themes/:id',
    ...writeAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        await deleteTheme(id)
        return res.status(204).end()
      } catch (err) {
        const code = (err as { code?: string })?.code
        if (code === 'P2025') {
          return res.status(404).end()
        }
        console.error('error deleting theme', err)
        return res.status(500).end()
      }
    },
  )
}
