import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { studentsRoutes } from './routes/students.js'
import { supervisionsRoutes } from './routes/supervisions.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

studentsRoutes(app)
supervisionsRoutes(app)

app.get('/', (_req, res) => {
  res.send('Wesh Chabiba!')
})

export { app }
