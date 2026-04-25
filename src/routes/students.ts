import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent,
} from '../services/students.js'

export function studentsRoutes(app: Application) {
  app.post(
    '/api/v1/students',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const student = await createStudent(req.body)
        return res.json(student)
      } catch (err) {
        console.error('error creating post', err)
        return res.status(500).end()
      }
    },
  )

  app.get(
    '/api/v1/students',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { search, institution, level, page, limit } = req.query
        const students = await getStudents({
          search: search as string | undefined,
          institution: institution as
            | import('@prisma/client').Institution
            | undefined,
          level: level as import('@prisma/client').StudentLevel | undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        })
        return res.json(students)
      } catch (err) {
        console.error('error fetching students', err)
        return res.status(500).end()
      }
    },
  )

  app.get(
    '/api/v1/students/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params

      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }

      try {
        const student = await getStudentById(id)
        if (student === null) return res.status(404).end()
        return res.json(student)
      } catch (err) {
        console.error('error fetching student by id', err)
        return res.status(500).end()
      }
    },
  )

  app.put(
    '/api/v1/students/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params

      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }

      try {
        const student = await updateStudent(id, req.body)
        return res.json(student)
      } catch (err) {
        console.error('error updating student', err)
        return res.status(500).end()
      }
    },
  )

  app.delete(
    '/api/v1/students/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { id } = req.params

      if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID format' })
      }

      try {
        await deleteStudent(id)
        return res.status(204).end()
      } catch (err) {
        console.error('error deleting student', err)
        return res.status(500).end()
      }
    },
  )
}
