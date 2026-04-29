import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { getAuditLogs, getDashboardStats } from '../services/admin.js'

export function adminRoutes(app: Application) {
  const adminOnly = [requireAuth, requireRole('ADMIN')]

  // GET /api/v1/admin/stats -- dashboard overview stats
  app.get(
    '/api/v1/admin/stats',
    ...adminOnly,
    async (_req: Request, res: Response) => {
      try {
        const stats = await getDashboardStats()
        return res.status(200).json(stats)
      } catch (err) {
        console.error('error fetching admin stats', err)
        return res.status(500).end()
      }
    },
  )

  // GET /api/v1/admin/audit-logs -- paginated, filterable audit log
  app.get(
    '/api/v1/admin/audit-logs',
    ...adminOnly,
    async (req: Request, res: Response) => {
      try {
        const { from, to, userId, action, entityType, page, limit } = req.query
        const logs = await getAuditLogs({
          from: from as string | undefined,
          to: to as string | undefined,
          userId: userId as string | undefined,
          action: action as string | undefined,
          entityType: entityType as string | undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        })
        return res.status(200).json(logs)
      } catch (err) {
        console.error('error fetching audit logs', err)
        return res.status(500).end()
      }
    },
  )
}
