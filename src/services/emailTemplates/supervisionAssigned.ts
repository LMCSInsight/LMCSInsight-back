import {
  badgePrimary,
  button,
  card,
  divider,
  h1,
  htmlShell,
  kbdChip,
  microLabel,
  muted,
  p,
  quoteHighlight,
  TOKENS,
} from './layout.js'
import type { RenderedEmail } from './layout.js'

export interface SupervisionAssignedParams {
  supervisionTitle: string
  supervisionId: string
  loginUrl: string
}

export function renderSupervisionAssignedEmail(
  params: SupervisionAssignedParams,
): RenderedEmail {
  const title = params.supervisionTitle?.trim() || 'A supervision'
  const subject = 'A supervision needs your review'
  const preheader = `“${title}” was assigned to you on LMCS Insight.`

  const assignedPill = badgePrimary('Assigned')

  const referenceBlock = `
<div style="margin:8px 0 0 0;">
  ${microLabel('Reference')}
  ${kbdChip(params.supervisionId)}
</div>`.trim()

  const ctaBlock = params.loginUrl
    ? `<div style="margin-top:32px;">${button({
        href: params.loginUrl,
        label: 'Open in app',
      })}</div>`
    : `<div style="margin-top:24px;">${p(
        'Sign in to LMCS Insight to review this supervision.',
        { color: TOKENS.COLORS.muted, size: 13, marginBottom: 0 },
      )}</div>`

  const cardBody = [
    `<div style="margin-bottom:20px;">${assignedPill}</div>`,
    h1('A supervision needs your review.'),
    p('You were assigned as supervisor on:'),
    quoteHighlight(title),
    referenceBlock,
    ctaBlock,
    divider(),
    muted(
      'Sign in to validate, request revisions, or reject this supervision.',
    ),
  ].join('\n')

  const html = htmlShell({
    preheader,
    title: subject,
    children: card(cardBody),
  })

  const ctaLine = params.loginUrl
    ? `Open in app: ${params.loginUrl}`
    : 'Sign in to LMCS Insight to review this supervision.'

  const text = [
    'LMCS INSIGHT',
    '',
    'A supervision needs your review.',
    '',
    'You were assigned as supervisor on:',
    `“${title}”`,
    '',
    `Reference: ${params.supervisionId}`,
    '',
    ctaLine,
    '',
    'Sign in to validate, request revisions, or reject this supervision.',
    '',
    '— This is an automated message, please do not reply.',
  ].join('\n')

  return { subject, text, html }
}
