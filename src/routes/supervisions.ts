import type { Application, Request, Response } from 'express'
import {
  createSupervision,
  getSupervisions,
  getSupervisionById,
  updateSupervision,
  deleteSupervision,
  assignSupervisor,
  removeSupervisor,
} from '../services/supervisions.js'

const getErrorMessage = (err: unknown): string => {
  return err instanceof Error ? err.message : 'Unexpected error'
}

export function supervisionsRoutes(app: Application) {
  app.post('/api/v1/supervisions', async (req: Request, res: Response) => {
    try {
      const supervision = await createSupervision(req.body)
      res.status(201).json(supervision)
    } catch (err: unknown) {
      console.error('error creating supervision', err)
      res.status(400).json({ error: getErrorMessage(err) })
    }
  })

  app.get('/api/v1/supervisions', async (_req: Request, res: Response) => {
    try {
      const supervisions = await getSupervisions()
      res.json(supervisions)
    } catch (err: unknown) {
      console.error('error fetching supervisions', err)
      res.status(500).json({ error: getErrorMessage(err) })
    }
  })

  app.get('/api/v1/supervisions/:id', async (req: Request, res: Response) => {
    try {
      const supervision = await getSupervisionById(req.params.id as string)
      if (!supervision) {
        res.status(404).json({ error: 'Supervision not found' })
        return
      }
      res.json(supervision)
    } catch (err: unknown) {
      console.error('error fetching supervision', err)
      res.status(500).json({ error: getErrorMessage(err) })
    }
  })

  app.put('/api/v1/supervisions/:id', async (req: Request, res: Response) => {
    try {
      const supervision = await updateSupervision(
        req.params.id as string,
        req.body,
      )
      res.json(supervision)
    } catch (err: unknown) {
      console.error('error updating supervision', err)
      res.status(400).json({ error: getErrorMessage(err) })
    }
  })

  app.delete(
    '/api/v1/supervisions/:id',
    async (req: Request, res: Response) => {
      try {
        await deleteSupervision(req.params.id as string)
        res.status(204).end()
      } catch (err: unknown) {
        console.error('error deleting supervision', err)
        res.status(500).json({ error: getErrorMessage(err) })
      }
    },
  )

  // Supervisor assignment operations
  app.post(
    '/api/v1/supervisions/:id/supervisors',
    async (req: Request, res: Response) => {
      try {
        const assignment = await assignSupervisor(
          req.params.id as string,
          req.body,
        )
        res.status(201).json(assignment)
      } catch (err: unknown) {
        console.error('error assigning supervisor', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.delete(
    '/api/v1/supervisions/:id/supervisors/:supervisorId',
    async (req: Request, res: Response) => {
      try {
        await removeSupervisor(
          req.params.id as string,
          req.params.supervisorId as string,
        )
        res.status(204).end()
      } catch (err: unknown) {
        console.error('error removing supervisor', err)
        res.status(500).json({ error: getErrorMessage(err) })
      }
    },
  )
}
