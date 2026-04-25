import type { Application, Request, Response } from 'express'
import {
  createSupervision,
  getSupervisions,
  getSupervisionById,
  updateSupervision,
  deleteSupervision,
  assignSupervisor,
  removeSupervisor,
  replaceSupervisionSupervisors,
} from '../services/supervisions.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { prisma } from '../db/prisma.js'
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

const mapServiceError = (
  res: Response,
  err: unknown,
): { handled: true } | { handled: false } => {
  const m = getErrorMessage(err)
  if (m === 'NOT_REVIEWER') {
    res.status(403).json({ error: 'NOT_REVIEWER' })
    return { handled: true }
  }
  if (m === 'VALIDATED_LOCKED') {
    res.status(400).json({ error: m })
    return { handled: true }
  }
  if (m === 'NOT_FOUND') {
    return { handled: false }
  }
  return { handled: false }
}

export function supervisionsRoutes(app: Application) {
  app.post(
    '/api/v1/supervisions',
    requireAuth,
    requireRole('ASSISTANT'),
    async (req: Request, res: Response) => {
      try {
        const supervision = await createSupervision(req.body, req.user!.id)
        res.status(201).json(supervision)
      } catch (err: unknown) {
        console.error('error creating supervision', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.get(
    '/api/v1/supervisions',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const {
          type,
          status,
          validationStatus,
          academicYear,
          search,
          page,
          limit,
          submittedByUserId: submittedByQ,
        } = req.query
        let effectiveSupervisorId = req.query.supervisorId as string | undefined
        if (req.user!.role === 'RESEARCHER') {
          const chercheur = await prisma.chercheur.findFirst({
            where: { user: { id: req.user!.id } },
            select: { chercheur_id: true },
          })
          // Ignore any client-provided supervisorId: researchers only see their own
          // rows. If the account is not linked to a chercheur, return nothing (do not
          // fall back to an unfiltered list).
          effectiveSupervisorId = chercheur?.chercheur_id
        }
        if (req.user!.role === 'RESEARCHER' && !effectiveSupervisorId) {
          const p = page ? Number(page) : 1
          const lim = limit ? Number(limit) : 20
          res.json({ data: [], total: 0, page: p, limit: lim })
          return
        }
        let submittedByUserId: string | undefined
        if (req.user!.role === 'ASSISTANT' && submittedByQ) {
          submittedByUserId = String(submittedByQ)
        }
        const supervisions = await getSupervisions({
          type: type as string | undefined,
          status: status as string | undefined,
          validationStatus: validationStatus as string | undefined,
          academicYear: academicYear as string | undefined,
          supervisorId: effectiveSupervisorId,
          search: search as string | undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
          submittedByUserId,
        })
        res.json(supervisions)
      } catch (err: unknown) {
        console.error('error fetching supervisions', err)
        res.status(500).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.get(
    '/api/v1/supervisions/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const supervision = await getSupervisionById(req.params.id as string)
        if (!supervision) {
          res.status(404).json({ error: 'Supervision not found' })
          return
        }
        if (req.user!.role === 'RESEARCHER') {
          const chercheur = await prisma.chercheur.findFirst({
            where: { user: { id: req.user!.id } },
            select: { chercheur_id: true },
          })
          const myChercheurId = chercheur?.chercheur_id
          if (!myChercheurId) {
            res.status(404).json({ error: 'Supervision not found' })
            return
          }
          const isAssigned = supervision.supervisors.some(
            (s) => s.supervisorId === myChercheurId,
          )
          if (!isAssigned) {
            res.status(404).json({ error: 'Supervision not found' })
            return
          }
        }
        res.json(supervision)
      } catch (err: unknown) {
        console.error('error fetching supervision', err)
        res.status(500).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.put(
    '/api/v1/supervisions/:id',
    requireAuth,
    requireRole('ASSISTANT'),
    async (req: Request, res: Response) => {
      try {
        const supervision = await updateSupervision(
          req.params.id as string,
          req.body,
        )
        res.json(supervision)
      } catch (err: unknown) {
        const mapped = mapServiceError(res, err)
        if (mapped.handled) return
        if (getErrorMessage(err) === 'NOT_FOUND') {
          res.status(404).json({ error: 'Not found' })
          return
        }
        console.error('error updating supervision', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.delete(
    '/api/v1/supervisions/:id',
    requireAuth,
    requireRole('ASSISTANT'),
    async (req: Request, res: Response) => {
      try {
        await deleteSupervision(req.params.id as string)
        res.status(204).end()
      } catch (err: unknown) {
        const m = getErrorMessage(err)
        if (m === 'SUPERVISION_NOT_DELETABLE') {
          res.status(400).json({ error: m })
          return
        }
        if (m === 'NOT_FOUND') {
          res.status(404).json({ error: 'Not found' })
          return
        }
        console.error('error deleting supervision', err)
        res.status(500).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.post(
    '/api/v1/supervisions/:id/supervisors',
    requireAuth,
    requireRole('ASSISTANT'),
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

  app.put(
    '/api/v1/supervisions/:id/supervisors',
    requireAuth,
    requireRole('ASSISTANT'),
    async (req: Request, res: Response) => {
      try {
        const supervision = await replaceSupervisionSupervisors(
          req.params.id as string,
          req.body,
        )
        res.json(supervision)
      } catch (err: unknown) {
        const mapped = mapServiceError(res, err)
        if (mapped.handled) return
        if (getErrorMessage(err) === 'NOT_FOUND') {
          res.status(404).json({ error: 'Not found' })
          return
        }
        console.error('error replacing supervisors', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.delete(
    '/api/v1/supervisions/:id/supervisors/:supervisorId',
    requireAuth,
    requireRole('ASSISTANT'),
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

  app.post(
    '/api/v1/supervisions/:id/validate',
    requireAuth,
    requireRole('RESEARCHER'),
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
        const mapped = mapServiceError(res, err)
        if (mapped.handled) return
        console.error('error validating supervision', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.post(
    '/api/v1/supervisions/:id/reject',
    requireAuth,
    requireRole('RESEARCHER'),
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
        const mapped = mapServiceError(res, err)
        if (mapped.handled) return
        console.error('error rejecting supervision', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )

  app.post(
    '/api/v1/supervisions/:id/revise',
    requireAuth,
    requireRole('RESEARCHER'),
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
        const mapped = mapServiceError(res, err)
        if (mapped.handled) return
        console.error('error revising supervision', err)
        res.status(400).json({ error: getErrorMessage(err) })
      }
    },
  )
}
