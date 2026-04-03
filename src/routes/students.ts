import type { Application, Request, Response } from 'express'
import { createStudent } from '../services/students.js'

export function studentsRoutes(app: Application) {
  app.post('/api/v1/students', async (req: Request, res: Response) => {
    try {
      const student = await createStudent(req.body)
      return res.json(student)
    } catch (err) {
      console.error('error creating post', err)
      return res.status(500).end()
    }
  })
}
