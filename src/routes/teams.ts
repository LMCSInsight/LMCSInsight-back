import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import {
  createTeam,
  deleteTeam,
  getTeamById,
  getTeams,
  updateTeam,
} from '../services/teams.js'

const writeAuth = [requireAuth, requireRole('ADMIN')]

export function teamsRoutes(app: Application) {
  app.post(
    '/api/v1/teams',
    ...writeAuth,
    async (req: Request, res: Response) => {
      try {
        const team = await createTeam(req.body)
        return res.status(201).json(team)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'THEME_NOT_FOUND') {
          return res.status(400).json({ error: message })
        }
        console.error('error creating team', err)
        return res.status(400).json({ error: message || 'create failed' })
      }
    },
  )

  app.get('/api/v1/teams', requireAuth, async (req: Request, res: Response) => {
    try {
      const { search, page, limit } = req.query
      const result = await getTeams({
        search: search as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      })
      return res.json(result)
    } catch (err) {
      console.error('error listing teams', err)
      return res.status(500).end()
    }
  })

  app.get(
    '/api/v1/teams/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        const team = await getTeamById(id)
        if (!team) return res.status(404).end()
        return res.json(team)
      } catch (err) {
        console.error('error fetching team', err)
        return res.status(400).json({ error: 'Invalid request' })
      }
    },
  )

  app.put(
    '/api/v1/teams/:id',
    ...writeAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        const team = await updateTeam(id, req.body)
        return res.json(team)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'THEME_NOT_FOUND') {
          return res.status(400).json({ error: message })
        }
        if (message === 'EMPTY_UPDATE') {
          return res.status(400).json({ error: message })
        }
        if ((err as { code?: string })?.code === 'P2025')
          return res.status(404).end()
        console.error('error updating team', err)
        return res.status(400).json({ error: message || 'update failed' })
      }
    },
  )

  app.delete(
    '/api/v1/teams/:id',
    ...writeAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params
      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }
      try {
        await deleteTeam(id)
        return res.status(204).end()
      } catch (err) {
        if ((err as { code?: string })?.code === 'P2025')
          return res.status(404).end()
        console.error('error deleting team', err)
        return res.status(500).end()
      }
    },
  )
}
