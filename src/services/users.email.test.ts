import { createRequire } from 'node:module'
import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from '@jest/globals'

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test'

const nodeRequire = createRequire(import.meta.url)
const emailModuleUrl = nodeRequire.resolve('./email.js')

const sendNewUserCredentialsEmail = jest
  .fn()
  .mockImplementation(async (): Promise<void> => undefined)

jest.unstable_mockModule(emailModuleUrl, () => ({
  sendNewUserCredentialsEmail,
  sendSupervisionAssignedEmail: jest.fn(),
  resolveSupervisorMailRecipient: jest.fn(),
  getAppLoginUrl: () => 'http://localhost:5173/login',
  isEmailConfigured: () => true,
  resetEmailTransporterForTests: jest.fn(),
}))

describe('createUser email hook', () => {
  let createUser: (typeof import('./users.js'))['createUser']

  beforeAll(async () => {
    ;({ createUser } = await import('./users.js'))
  })

  beforeEach(() => {
    sendNewUserCredentialsEmail.mockClear()
  })

  it('fires welcome email after user is created', async () => {
    await createUser({
      email: 'new.user@test.example',
      password: 'secret12',
      firstName: 'Test',
      lastName: 'User',
      role: 'ASSISTANT',
    })
    await new Promise<void>((r) => setImmediate(r))
    await new Promise<void>((r) => setImmediate(r))
    expect(sendNewUserCredentialsEmail).toHaveBeenCalledTimes(1)
    expect(sendNewUserCredentialsEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'new.user@test.example',
        email: 'new.user@test.example',
        firstName: 'Test',
        password: 'secret12',
        loginUrl: 'http://localhost:5173/login',
      }),
    )
  })
})
