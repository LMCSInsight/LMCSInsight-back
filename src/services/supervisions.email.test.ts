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
const prismaModuleUrl = nodeRequire.resolve('../db/prisma.js')

const sendSupervisionAssignedEmail = jest
  .fn()
  .mockImplementation(async (): Promise<void> => undefined)
const resolveSupervisorMailRecipient = jest
  .fn()
  .mockImplementation(
    async (): Promise<string | null> => 'supervisor@example.com',
  )

jest.unstable_mockModule(emailModuleUrl, () => ({
  sendSupervisionAssignedEmail,
  resolveSupervisorMailRecipient,
  sendNewUserCredentialsEmail: jest.fn(),
  getAppLoginUrl: () => 'http://localhost:5173/login',
  isEmailConfigured: () => true,
  resetEmailTransporterForTests: jest.fn(),
}))

jest.unstable_mockModule(prismaModuleUrl, () => ({
  prisma: {
    supervision: {
      findUnique: jest
        .fn()
        .mockImplementation(async () => ({ title: 'My thesis' })),
    },
    chercheur: {
      findUnique: jest.fn().mockImplementation(async () => ({
        user: { id: 'user-1', isActive: true },
      })),
    },
    notification: {
      create: jest.fn().mockImplementation(async () => ({ id: 'n1' })),
    },
  },
}))

import { resetSupervisionSupervisorMock } from '../test/mocks/studentModelMock.js'

describe('assignSupervisor email hook', () => {
  let assignSupervisor: (typeof import('./supervisions.js'))['assignSupervisor']

  beforeAll(async () => {
    ;({ assignSupervisor } = await import('./supervisions.js'))
  })

  beforeEach(() => {
    resetSupervisionSupervisorMock()
    sendSupervisionAssignedEmail.mockClear()
    resolveSupervisorMailRecipient.mockClear()
    resolveSupervisorMailRecipient.mockImplementation(
      async (): Promise<string | null> => 'supervisor@example.com',
    )
  })

  it('sends supervision assigned email after a new assignment', async () => {
    await assignSupervisor('sup-uuid-1', {
      supervisorId: 'chercheur-1',
      isMainSupervisor: true,
      contributionPercent: 100,
    })
    await new Promise<void>((r) => setImmediate(r))
    await new Promise<void>((r) => setImmediate(r))
    expect(resolveSupervisorMailRecipient).toHaveBeenCalledWith('chercheur-1')
    expect(sendSupervisionAssignedEmail).toHaveBeenCalledWith({
      to: 'supervisor@example.com',
      supervisionTitle: 'My thesis',
      supervisionId: 'sup-uuid-1',
    })
  })
})
