import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { authRoutes } from './routes/auth.js'
import { studentsRoutes } from './routes/students.js'
import { supervisionsRoutes } from './routes/supervisions.js'
import { validationRoutes } from './routes/validation.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

authRoutes(app)
studentsRoutes(app)
supervisionsRoutes(app)
validationRoutes(app)

app.get('/', (_req, res) => {
  res.send('Wesh Chabiba!')
})

app.use(errorHandler)

export { app }
