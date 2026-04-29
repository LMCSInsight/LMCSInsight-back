import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { authRoutes } from './routes/auth.js'
import { studentsRoutes } from './routes/students.js'
import { supervisionsRoutes } from './routes/supervisions.js'
import { validationRoutes } from './routes/validation.js'
import { notificationsRoutes } from './routes/notifications.js'
import { themesRoutes } from './routes/themes.js'
import { teamsRoutes } from './routes/teams.js'
import { chercheursRoutes } from './routes/chercheurs.js'
import { errorHandler } from './middleware/errorHandler.js'
import { usersRoutes } from './routes/users.js'
import { adminRoutes } from './routes/admin.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

authRoutes(app)
usersRoutes(app)
studentsRoutes(app)
themesRoutes(app)
teamsRoutes(app)
chercheursRoutes(app)
supervisionsRoutes(app)
validationRoutes(app)
notificationsRoutes(app)
adminRoutes(app)

app.get('/', (_req, res) => {
  res.send('Wesh Chabiba!')
})

app.use(errorHandler)

export { app }
