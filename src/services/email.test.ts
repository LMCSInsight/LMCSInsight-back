import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals'

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test'

const sendMail = jest.fn(async () => ({ messageId: 'test-msg' }))

jest.unstable_mockModule('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({ sendMail })),
  },
}))

describe('email service (SMTP)', () => {
  beforeEach(async () => {
    sendMail.mockClear()
    process.env.SMTP_HOST = 'smtp.test.example'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_SECURE = 'false'
    process.env.SMTP_USER = ''
    process.env.SMTP_PASS = ''
    process.env.MAIL_FROM = 'LMCS <noreply@test.example>'
    const email = await import('./email.js')
    email.resetEmailTransporterForTests()
  })

  afterEach(() => {
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_SECURE
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.MAIL_FROM
    void import('./email.js').then((m) => m.resetEmailTransporterForTests())
  })

  it('sendSupervisionAssignedEmail calls nodemailer sendMail', async () => {
    const { sendSupervisionAssignedEmail } = await import('./email.js')
    await sendSupervisionAssignedEmail({
      to: 'supervisor@test.example',
      supervisionTitle: 'PFE topic',
      supervisionId: 'sup-id-1',
    })
    expect(sendMail).toHaveBeenCalledTimes(1)
    const calls = sendMail.mock.calls as unknown as Array<
      [Record<string, string>]
    >
    const first = calls[0]?.[0] as {
      to: string
      subject: string
      text: string
    }
    expect(first).toBeDefined()
    const arg = first!
    expect(arg.to).toBe('supervisor@test.example')
    expect(arg.subject).toContain('supervision')
    expect(arg.text).toContain('PFE topic')
  })

  it('sendNewUserCredentialsEmail calls nodemailer sendMail', async () => {
    const { sendNewUserCredentialsEmail } = await import('./email.js')
    await sendNewUserCredentialsEmail({
      to: 'newuser@test.example',
      firstName: 'Ada',
      email: 'newuser@test.example',
      password: 'temp-secret',
      loginUrl: 'http://localhost:5173/login',
    })
    expect(sendMail).toHaveBeenCalledTimes(1)
    const mailCalls = sendMail.mock.calls as unknown as Array<
      [Record<string, string>]
    >
    const arg = mailCalls[0]?.[0] as {
      html: string
      text: string
    }
    expect(arg).toBeDefined()
    expect(arg.text).toContain('temp-secret')
    expect(arg.html).toContain('temp-secret')
  })

  it('skips sendMail when SMTP is not configured', async () => {
    delete process.env.SMTP_HOST
    const email = await import('./email.js')
    email.resetEmailTransporterForTests()
    await email.sendSupervisionAssignedEmail({
      to: 'x@test.example',
      supervisionTitle: 'T',
      supervisionId: 'id',
    })
    expect(sendMail).not.toHaveBeenCalled()
  })
})
