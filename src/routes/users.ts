import type { Application, Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from '../services/users.js'


export function usersRoutes(app : Application)
{
    app.post('/api/v1/users' , requireAuth , async (req: Request , res: Response) =>
    {
        try{
            const user = await createUser(req.body)
            return res.status(201).json(user)
        } catch (err) {
            console.error('error creating user' , err)
            return res.status(500).end()
        }
    })

    app.get('/api/v1/users' , requireAuth , async (req : Request , res: Response) => {
        try {
            const { search , role , page , limit} = req.query
            const users = await getUsers({
                search: search as string | undefined,
                role: role as 'ADMIN' | 'DIRECTOR' | 'RESEARCHER' | 'ASSISTANT' | undefined,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            })
            return res.status(200).json(users)
        } catch (err) {
            console.error('error fetching users' , err)
            return res.status(500).end()
        }
    })

    app.get('/api/v1/users/:id' , requireAuth , async (req: Request , res: Response) => {
        const { id } = req.params

        if (typeof id !== 'string')
        {
            return res.status(400).json({ error: 'Invalid ID format' })
        }

        try {
            const user = await getUserById(id)
            if (user === null) return res.status(404).end()
            return res.status(200).json(user)
        } catch (err) {
            console.error('error fetching user by id' , err)
            return res.status(500).end()
        }
    })

    app.put('/api/v1/user/:id' , requireAuth , async (req: Request , res: Response) => {
        const { id } = req.params

        if (typeof id !== 'string')
        {
            return res.status(400).json({ error: 'Invalid ID format' })
        }

        try {
            const user = await updateUser(id , req.body)
            return res.json(user)
        }
        catch (err) {
            console.error('error updating user' , err)
            return res.status(500).end()
        }
    })

    app.delete('/api/v1/users/:id' , requireAuth , async (req: Request , res: Response) => {
        const { id } = req.params

        if (typeof id !== 'string')
        {
            return res.status(400).json({ error: 'Invalid ID format' })
        }

        try {
            await deleteUser(id)
            return res.status(204).end()
        } catch (err) {
            console.error('error deleting user' , err)
            return res.status(500).end()
        }
    }) 
}
    
