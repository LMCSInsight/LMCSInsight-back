import { z } from 'zod'

import { UserModel } from '../db/models/index.js'

export const createUserScehma = z.object({
    email: z.string().email(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    firstName: z.string().min(1, {message: 'firstName is required'}),
    lastName: z.string().min(1, {message: 'lastName is required'}),
    role: z.enum(['ADMIN', 'DIRECTOR', 'RESEARCHER' , 'ASSISTANT']),
    phoneNumber: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserScehma>

export async function createUser(input: CreateUserInput)
{
    const validated = createUserScehma.parse(input)

    return UserModel.create({
        data: validated,
    })
}

export interface GetUsersOptions {
    search?: string
    role?: 'ADMIN' | 'DIRECTOR' | 'RESEARCHER' | 'ASSISTANT'
    page?: number
    limit?: number
}

export async function getUsers(options: GetUsersOptions = {}) {
    const { search , role , page = 1 , limit = 20} = options
    const skip = (page - 1) * limit

    const where = {
        ...(role && { role }),
        ...(search && {
            OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
            ],
        }),
    }

    const [data , total] = await Promise.all([
        UserModel.findMany({
            where,
            skip,
            take: limit,
            orderBy: { lastName: 'asc' },
        }),
        UserModel.count({ where }),
    ])

    return { data , total , page , limit }
}

export async function getUserById(id: string) {
    return UserModel.findUnique({
        where: { id },
    })
}

export async function updateUser(id: string , input: Partial<CreateUserInput>) {
    const validated = createUserScehma.partial().parse(input)

    return UserModel.update({
        where: { id},
        data: validated,
    })
}

export async function deleteUser(id: string)
{
    return UserModel.delete({
        where: { id },
    })
}
