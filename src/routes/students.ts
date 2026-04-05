import type { Application, Request, Response } from 'express'
import { createStudent, getStudents } from '../services/students.js'

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

  app.get('/api/v1/students', async (_req: Request, res: Response) => {
    try {
      const students = await getStudents()
      return res.json(students)
    } catch (err){
      console.error('error fetching students', err)
      return res.status(500).end()
    }
    })
}
