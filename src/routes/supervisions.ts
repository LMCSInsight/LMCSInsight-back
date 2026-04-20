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
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import {
  validateSchema,
  rejectSchema,
  reviseSchema,
  validateSupervision,
  rejectSupervision,
  reviseSupervision,
} from '../services/validation.js'

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

  app.get('/api/v1/supervisions', async (req: Request, res: Response) => {
    try {
      const {
        type,
        status,
        validationStatus,
        academicYear,
        supervisorId,
        search,
        page,
        limit,
      } = req.query
      const supervisions = await getSupervisions({
        type: type as string | undefined,
        status: status as string | undefined,
        validationStatus: validationStatus as string | undefined,
        academicYear: academicYear as string | undefined,
        supervisorId: supervisorId as string | undefined,
        search: search as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      })
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

  // ── Validation actions ───────────────────────────────────────────────────────

  app.post(
    '/api/v1/supervisions/:id/validate',
    requireAuth,
    requireRole('ASSISTANT'),
    async (req: Request, res: Response) => {
      try {
        const body = validateSchema.parse(req.body)
        const supervision = await validateSupervision({
          supervisionId: req.params.id as string,
          validatorId: req.user!.id,
          ...body,
        })
        res.json(supervision)
      } catch (err: unknown) {
        console.error('error validating supervision', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.post(
    '/api/v1/supervisions/:id/reject',
    requireAuth,
    requireRole('ASSISTANT'),
    async (req: Request, res: Response) => {
      try {
        const body = rejectSchema.parse(req.body)
        const supervision = await rejectSupervision({
          supervisionId: req.params.id as string,
          validatorId: req.user!.id,
          ...body,
        })
        res.json(supervision)
      } catch (err: unknown) {
        console.error('error rejecting supervision', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.post(
    '/api/v1/supervisions/:id/revise',
    requireAuth,
    requireRole('ASSISTANT'),
    async (req: Request, res: Response) => {
      try {
        const body = reviseSchema.parse(req.body)
        const supervision = await reviseSupervision({
          supervisionId: req.params.id as string,
          validatorId: req.user!.id,
          ...body,
        })
        res.json(supervision)
      } catch (err: unknown) {
        console.error('error revising supervision', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )
}
