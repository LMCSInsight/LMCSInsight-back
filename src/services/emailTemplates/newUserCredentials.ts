import {
  badgePrimary,
  button,
  card,
  divider,
  eyebrowChip,
  h1,
  htmlShell,
  kbdChip,
  microLabel,
  muted,
  p,
  TOKENS,
} from './layout.js'
import type { RenderedEmail } from './layout.js'

export interface NewUserCredentialsParams {
  firstName: string
  email: string
  password: string
  loginUrl: string
}

export function renderNewUserCredentialsEmail(
  params: NewUserCredentialsParams,
): RenderedEmail {
  const subject = 'Your LMCS Insight account is ready'
  const preheader =
    'Sign-in details inside. Change your password after the first sign-in.'

  const credentialsBlock = `
<div style="margin:24px 0 0 0;">
  ${microLabel('Email')}
  ${kbdChip(params.email)}
</div>
<div style="margin:20px 0 0 0;">
  ${microLabel('Temporary password')}
  ${kbdChip(params.password)}${badgePrimary('Temporary', 10)}
</div>`.trim()

  const ctaBlock = params.loginUrl
    ? `<div style="margin-top:32px;">${button({
        href: params.loginUrl,
        label: 'Sign in',
      })}</div>`
    : `<div style="margin-top:24px;">${p(
        'Use the LMCS Insight URL your administrator gave you to sign in.',
        { color: TOKENS.COLORS.muted, size: 13, marginBottom: 0 },
      )}</div>`

  const cardBody = [
    `<div style="margin-bottom:14px;">${eyebrowChip('Account')}</div>`,
    h1(`Your account is ready, ${params.firstName}.`),
    p(
      'An administrator created an LMCS Insight account for you. Use the credentials below to sign in.',
    ),
    credentialsBlock,
    ctaBlock,
    divider(),
    muted('For security, change your password after the first sign-in.'),
    muted('If you did not expect this message, contact your administrator.'),
  ].join('\n')

  const html = htmlShell({
    preheader,
    title: subject,
    children: card(cardBody),
  })

  const loginLine = params.loginUrl
    ? `Sign in: ${params.loginUrl}`
    : 'Use the LMCS Insight URL your administrator gave you to sign in.'

  const text = [
    'LMCS INSIGHT',
    '',
    `Your account is ready, ${params.firstName}.`,
    '',
    'An administrator created an LMCS Insight account for you.',
    'Use the credentials below to sign in.',
    '',
    `Email:    ${params.email}`,
    `Password: ${params.password}  (temporary)`,
    '',
    loginLine,
    '',
    'For security, change your password after the first sign-in.',
    '',
    'If you did not expect this message, contact your administrator.',
    '',
    '— This is an automated message, please do not reply.',
  ].join('\n')

  return { subject, text, html }
}
