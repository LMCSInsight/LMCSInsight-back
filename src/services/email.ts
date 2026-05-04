import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

import { prisma } from '../db/prisma.js'

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
  const title = params.supervisionTitle || 'A supervision'
  const subject = 'New supervision assigned to you'
  const text = [
    `You have been assigned as a supervisor for: "${title}".`,
    '',
    `Supervision ID: ${params.supervisionId}`,
    '',
    'Open the LMCS Insight app to review this supervision.',
  ].join('\n')
  const html = `
    <p>You have been assigned as a supervisor for: <strong>${escapeHtml(
      title,
    )}</strong>.</p>
    <p>Supervision ID: <code>${escapeHtml(params.supervisionId)}</code></p>
    <p>Open the LMCS Insight app to review this supervision.</p>
  `.trim()
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
  const subject = 'Your LMCS Insight account'
  const loginLine = params.loginUrl
    ? `Sign in: ${params.loginUrl}`
    : 'Use the LMCS Insight app URL your administrator gave you to sign in.'
  const text = [
    `Hello ${params.firstName},`,
    '',
    'An administrator created an account for you on LMCS Insight.',
    '',
    `Email (login): ${params.email}`,
    `Temporary password: ${params.password}`,
    '',
    loginLine,
    '',
    'For security, change your password after you first sign in.',
    '',
    'If you did not expect this message, contact your administrator.',
  ].join('\n')
  const html = `
    <p>Hello ${escapeHtml(params.firstName)},</p>
    <p>An administrator created an account for you on <strong>LMCS Insight</strong>.</p>
    <ul>
      <li>Email (login): <strong>${escapeHtml(params.email)}</strong></li>
      <li>Temporary password: <strong>${escapeHtml(
        params.password,
      )}</strong></li>
    </ul>
    ${
      params.loginUrl
        ? `<p><a href="${escapeHtml(params.loginUrl)}">Sign in</a></p>`
        : '<p>Use the LMCS Insight app URL your administrator gave you to sign in.</p>'
    }
    <p><em>For security, change your password after you first sign in.</em></p>
    <p>If you did not expect this message, contact your administrator.</p>
  `.trim()
  await sendMail({ to: params.to, subject, text, html })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
