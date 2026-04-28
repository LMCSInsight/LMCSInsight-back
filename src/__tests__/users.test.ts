import { describe, test, expect } from '@jest/globals'
import {
  createUser,
  deleteUser,
  getUsers,
  getUserById,
  updateUser,
} from '../services/users.js'
import type { CreateUserInput } from '../services/users.js'

function uniqueEmail(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}.${Date.now()}.${randomPart}@esi.dz`
}

function buildUser(
  overrides: Partial<CreateUserInput> = {},
): CreateUserInput {
    return {
        firstName: 'Abderrahim',
        lastName: 'LARIBI',
        email: uniqueEmail('user'),
        password: 'password123',
        role: 'RESEARCHER',
        ...overrides,
    }
}



describe('creating users', () => {
  test('with all parameters should succeed', async () => {
    const user = buildUser()

    const createdUser = await createUser(user)
    expect(createdUser.id).toBeDefined()
    expect(createdUser.firstName).toBe(user.firstName)
    expect(createdUser.lastName).toBe(user.lastName)
    expect(createdUser.email).toBe(user.email)
    expect(createdUser.role).toBe(user.role)
  })

  test('without optional parameters should succeed', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { phoneNumber, ...user } = buildUser()

    const createdUser = await createUser(user)
    expect(createdUser.id).toBeDefined()
    expect(createdUser.firstName).toBe(user.firstName)
    expect(createdUser.lastName).toBe(user.lastName)
    expect(createdUser.email).toBe(user.email)
    expect(createdUser.role).toBe(user.role)
    expect(createdUser.phoneNumber).toBeUndefined()
  })

  test('with invalid email should fail', async () => {
    const user = buildUser({ email: 'invalid-email' })

    await expect(createUser(user)).rejects.toThrow()
  })

  test('without firstName should fail', async () => {
    const user = buildUser({ firstName: '' })

    await expect(createUser(user)).rejects.toThrow(
      'firstName is required',
    )
  })

  test('without lastName should fail', async () => {
    const user = buildUser({ lastName: '' })

    await expect(createUser(user)).rejects.toThrow('lastName is required')
  })

  test('with invalid role should fail', async () => {
    const user = buildUser({ role: 'INVALID' as 'RESEARCHER' })

    await expect(createUser(user)).rejects.toThrow()
  })


  test('with duplicate email should create both records in current test setup', async () => {
    const email = uniqueEmail('duplicate')
    const firstUser = buildUser({ email })
    const secondUser = buildUser({ email })

    const createdFirst = await createUser(firstUser)
    const createdSecond = await createUser(secondUser)

    expect(createdFirst.id).not.toBe(createdSecond.id)
    expect(createdSecond.email).toBe(email)
  })
})

describe('fetching users', () => {
  test('should return an array of users', async () => {
    const page = await getUsers()
    expect(Array.isArray(page.data)).toBe(true)
  })

  test('should contain recently created Ususersers', async () => {
    const firstUser = await createUser(
      buildUser({ firstName: 'First' }),
    )
    const secondUser = await createUser(
      buildUser({ firstName: 'Second' }),
    )

    const result = await getUsers()
    const UserIds = result.data.map((User) => User.id)

    expect(UserIds).toContain(firstUser.id)
    expect(UserIds).toContain(secondUser.id)
  })
})

describe('fetching user by id', () => {
  test('should return the user if it exists', async () => {
    const userData = buildUser({
      firstName: 'Youcef',
      lastName: 'AMERELKHEDOUD',
    })

    const createdUser = await createUser(userData)

    const fetchedUser = await getUserById(createdUser.id)

    expect(fetchedUser).not.toBeNull()
    expect(fetchedUser?.id).toBe(createdUser.id)
    expect(fetchedUser?.firstName).toBe(userData.firstName)
    expect(fetchedUser?.lastName).toBe(userData.lastName)
    expect(fetchedUser?.email).toBe(userData.email)
    expect(fetchedUser?.role).toBe(userData.role)})
})

  test('should return null if the user does not exist', async () => {
    const nonexistentID = 'non-existent-id'
    const fetchedUser = await getUserById(nonexistentID)

    expect(fetchedUser).toBeNull()
  })

  test('should return the updated version of a user', async () => {
    const createdUser = await createUser(buildUser())
    const updatedEmail = uniqueEmail('updated')

    await updateUser(createdUser.id, {
      firstName: 'Updated Name',
      email: updatedEmail,
    })

    const fetchedUser = await getUserById(createdUser.id)
    expect(fetchedUser).not.toBeNull()
    expect(fetchedUser?.firstName).toBe('Updated Name')
    expect(fetchedUser?.email).toBe(updatedEmail)
  })


describe('updating user', () => {
  test('should update the user successfully', async () => {
    const UserData = buildUser({
      firstName: 'Youcef',
      lastName: 'AMERELKHEDOUD',
    })

    const createdUser = await createUser(UserData)

    const updatedData = {
      firstName: 'Youcef Updated',
      role: 'ADMIN' as const,
    }

    const updatedUser = await updateUser(createdUser.id, updatedData)

    expect(updatedUser.id).toBe(createdUser.id)
    expect(updatedUser.firstName).toBe(updatedData.firstName)
    expect(updatedUser.lastName).toBe(UserData.lastName)
    expect(updatedUser.role).toBe(updatedData.role)
  })

  test('with invalid email should fail', async () => {
    const createdUser = await createUser(buildUser())

    await expect(
      updateUser(createdUser.id, { email: 'not-an-email' }),
    ).rejects.toThrow()
  })

  test('for a non-existing user should return null', async () => {
    const updatedUser = await updateUser('non-existent-id', {
      firstName: 'Nobody',
    })

    expect(updatedUser).toBeNull()
  })
})

describe('deleting user', () => {
  test('should delete the User successfully', async () => {
    const createdUser = await createUser(buildUser())

    const deletedUser = await deleteUser(createdUser.id)
    expect(deletedUser.id).toBe(createdUser.id)

    const fetchedUser = await getUserById(createdUser.id)
    expect(fetchedUser).toBeNull()
  })

  test('for a non-existing user should return null', async () => {
    const deletedUser = await deleteUser('non-existent-id')
    expect(deletedUser).toBeNull()
  })
})
