import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

import { prisma } from '../db/prisma.js'
import { renderNewUserCredentialsEmail } from './emailTemplates/newUserCredentials.js'
import { renderSupervisionAssignedEmail } from './emailTemplates/supervisionAssigned.js'

let transporter: Transporter | null | undefined
let missingConfigLogged = false

/** Test-only: clear cached transporter after env changes. */
export function resetEmailTransporterForTests(): void {
  transporter = undefined
  missingConfigLogged = false
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const portRaw = process.env.SMTP_PORT?.trim()
  const port = portRaw ? Number(portRaw) : 587
  const secure =
    String(process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true'
  const user = process.env.SMTP_USER?.trim() ?? ''
  const pass = process.env.SMTP_PASS?.trim() ?? ''
  const from = process.env.MAIL_FROM?.trim()
  return { host, port, secure, user, pass, from }
}

export function isEmailConfigured(): boolean {
  const { host, from } = readSmtpConfig()
  return Boolean(host && from)
}

/** Extra console guidance after nodemailer failures (no secrets logged). */
export function logSmtpFailureHint(err: unknown): void {
  const code =
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : ''
  if (code !== 'EAUTH') {
    return
  }
  const host = (process.env.SMTP_HOST ?? '').toLowerCase()
  if (!host.includes('gmail')) {
    return
  }
  console.error(
    '[email] Gmail rejected SMTP credentials (EAUTH). Enable 2-Step Verification on the Google account, create an App password (Google Account → Security → App passwords), set SMTP_USER to the full Gmail address, SMTP_PASS to that 16-character app password, and use MAIL_FROM consistent with that account.',
  )
}

function getTransporter(): Transporter | null {
  if (transporter !== undefined) {
    return transporter
  }
  const { host, port, secure, user, pass, from } = readSmtpConfig()
  if (!host || !from) {
    transporter = null
    if (!missingConfigLogged && process.env.NODE_ENV !== 'test') {
      missingConfigLogged = true
      console.warn(
        '[email] SMTP not configured (SMTP_HOST / MAIL_FROM). Transactional emails are disabled.',
      )
    }
    return null
  }
  transporter = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: user ? { user, pass } : undefined,
  })
  return transporter
}

async function sendMail(options: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<void> {
  const { from } = readSmtpConfig()
  if (!from) {
    return
  }
  const t = getTransporter()
  if (!t) {
    return
  }
  await t.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  })
}

/**
 * Prefer linked active User email; otherwise first Chercheur.mails entry.
 */
export async function resolveSupervisorMailRecipient(
  supervisorChercheurId: string,
): Promise<string | null> {
  const row = await prisma.chercheur.findUnique({
    where: { chercheur_id: supervisorChercheurId },
    select: {
      mails: true,
      user: { select: { email: true, isActive: true } },
    },
  })
  if (!row) {
    return null
  }
  if (row.user?.isActive && row.user.email) {
    return row.user.email
  }
  const first = row.mails?.find((m) => typeof m === 'string' && m.trim().length)
  return first?.trim() ?? null
}

export function getAppLoginUrl(): string {
  const base = (process.env.APP_PUBLIC_URL ?? '').trim().replace(/\/$/, '')
  if (!base) {
    return ''
  }
  return `${base}/login`
}

export async function sendSupervisionAssignedEmail(params: {
  to: string
  supervisionTitle: string
  supervisionId: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    return
  }
  const { subject, text, html } = renderSupervisionAssignedEmail({
    supervisionTitle: params.supervisionTitle,
    supervisionId: params.supervisionId,
    loginUrl: getAppLoginUrl(),
  })
  await sendMail({ to: params.to, subject, text, html })
}

export async function sendNewUserCredentialsEmail(params: {
  to: string
  firstName: string
  email: string
  password: string
  loginUrl: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    return
  }
  const { subject, text, html } = renderNewUserCredentialsEmail({
    firstName: params.firstName,
    email: params.email,
    password: params.password,
    loginUrl: params.loginUrl,
  })
  await sendMail({ to: params.to, subject, text, html })
}
