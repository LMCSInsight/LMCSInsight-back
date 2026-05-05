/**
 * Shared chrome and primitives for transactional emails.
 *
 * Visual language aligns with portal light mode + landing (`global.css`:
 * html:not(.dark) .portal-shell`, LandingPrimitives eyebrow chips).
 *
 * Email-safe:
 *  - Table layout, inline styles, optional Google Fonts link for DM Sans.
 *  - No JS; logo is a normal <img src="https://…">. Most clients block localhost.
 *    Set MAIL_LOGO_URL to a full HTTPS image URL, or APP_PUBLIC_URL to the deployed
 *    site origin so we use {origin}/lmcs.png (file must be served at that path).
 */

/** Approximate hex from `global.css` portal-shell light overrides (oklch → hex). */
const COLORS = {
  /** Page canvas (~ bg-muted/30 + tinted background) */
  canvas: '#f8fafc',
  /** Card surface */
  card: '#ffffff',
  /** --border */
  border: '#e2e8f0',
  /** Hero-top tint (~ primary / blue-100) */
  accentBar: '#dbeafe',
  /** --foreground */
  foreground: '#0f172a',
  /** Body copy (~ slate-600, readable on white) */
  body: '#475569',
  /** --muted-foreground */
  muted: '#64748b',
  /** --primary oklch(0.45 0.2 260) */
  primary: '#3358e6',
  /** --primary-foreground */
  primaryFg: '#fafafa',
  /** primary at ~10% on white */
  primarySoft: '#eff6ff',
  primarySoftBorder: '#bfdbfe',
  /** Input / muted chip bg */
  chipBg: '#f1f5f9',
} as const

const FONTS = {
  sans: `'DM Sans', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif`,
  mono: `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`,
} as const

export const TOKENS = { COLORS, FONTS } as const

export interface RenderedEmail {
  subject: string
  text: string
  html: string
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function appPublicOrigin(): string {
  return (process.env.APP_PUBLIC_URL ?? '').trim().replace(/\/$/, '')
}

/** Full URL to logo PNG. Prefer MAIL_LOGO_URL in production (HTTPS, public). */
function logoImageUrl(): string {
  const explicit = (process.env.MAIL_LOGO_URL ?? '').trim()
  if (explicit) return explicit
  const origin = appPublicOrigin()
  return origin ? `${origin}/lmcs.png` : ''
}

export interface ShellOptions {
  preheader: string
  title: string
  children: string
}

export function htmlShell({
  preheader,
  title,
  children,
}: ShellOptions): string {
  const logoUrl = logoImageUrl()

  const brandRow = logoUrl
    ? `<img src="${escapeHtml(
        logoUrl,
      )}" alt="LMCS" height="72" style="display:block;height:72px;width:auto;max-width:220px;border:0;outline:none;text-decoration:none;">`
    : `<span style="font-family:${FONTS.sans};font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.foreground};">LMCS Insight</span>`

  const fontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&display=swap" rel="stylesheet">`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
${fontLinks}
<style>
@media (max-width:600px) {
  .lmcs-container { width:100% !important; }
  .lmcs-card { padding:28px !important; }
  .lmcs-h1 { font-size:22px !important; }
  .lmcs-outer { padding:32px 16px 48px 16px !important; }
}
</style>
<!--[if mso]>
<style type="text/css">
body, table, td, p, a, h1, h2, h3 { mso-line-height-rule: exactly !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:${COLORS.canvas};">
<span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:${
    COLORS.canvas
  };line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
    preheader,
  )}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${
    COLORS.canvas
  };">
  <tr><td style="height:4px;background:${
    COLORS.accentBar
  };line-height:4px;font-size:4px;">&nbsp;</td></tr>
  <tr>
    <td class="lmcs-outer" align="center" style="padding:48px 24px 56px 24px;">
      <table role="presentation" class="lmcs-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr>
          <td style="padding:0 4px 24px 4px;text-align:left;">
            ${brandRow}
          </td>
        </tr>
        <tr><td>${children}</td></tr>
        <tr>
          <td style="padding:28px 4px 0 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="height:1px;line-height:1px;font-size:1px;background:${
                COLORS.border
              };">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0 4px;">
            <p style="margin:0 0 6px 0;font-family:${
              FONTS.sans
            };font-size:12px;line-height:1.55;color:${
              COLORS.muted
            };">This is an automated message — please do not reply.</p>
            <p style="margin:0;font-family:${
              FONTS.sans
            };font-size:12px;line-height:1.55;color:${
              COLORS.muted
            };">LMCS Insight · Laboratoire des Méthodes de Conception de Systèmes</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

/** Matches landing `SectionHeader` eyebrow: bordered chip on card tone. */
export function eyebrowChip(text: string): string {
  return `<span style="display:inline-block;border:1px solid ${
    COLORS.border
  };background:${COLORS.card};padding:6px 10px;border-radius:6px;font-family:${
    FONTS.sans
  };font-size:11px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${
    COLORS.muted
  };">${escapeHtml(text)}</span>`
}

/** Matches notification-style `bg-primary/10 text-primary` badges in portals. */
export function badgePrimary(label: string, marginLeft = 0): string {
  const ml = marginLeft ? `margin-left:${marginLeft}px;` : ''
  return `<span style="display:inline-block;background:${
    COLORS.primarySoft
  };color:${COLORS.primary};border:1px solid ${
    COLORS.primarySoftBorder
  };font-family:${
    FONTS.sans
  };font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:6px;vertical-align:middle;${ml}">${escapeHtml(
    label,
  )}</span>`
}

export function card(children: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;box-shadow:0 2px 8px -2px rgba(51,88,230,0.12);">
  <tr><td class="lmcs-card" style="padding:36px;">${children}</td></tr>
</table>`
}

export interface ButtonOptions {
  href: string
  label: string
}

export function button({ href, label }: ButtonOptions): string {
  const safeHref = escapeHtml(href)
  const safeLabel = escapeHtml(label)
  const fill = COLORS.primary
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr><td>
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:44px;v-text-anchor:middle;width:168px;" arcsize="18%" stroke="f" fillcolor="${fill}">
      <w:anchorlock/>
      <center style="color:${COLORS.primaryFg};font-family:${FONTS.sans};font-size:14px;font-weight:600;">${safeLabel}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${safeHref}" style="display:inline-block;background:${fill};color:${COLORS.primaryFg};font-family:${FONTS.sans};font-size:14px;font-weight:600;line-height:1;text-decoration:none;padding:13px 22px;border-radius:8px;">${safeLabel}</a>
    <!--<![endif]-->
  </td></tr>
</table>`
}

/** Uppercase field label (credentials, reference). */
export function microLabel(text: string): string {
  return `<div style="font-family:${
    FONTS.sans
  };font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${
    COLORS.muted
  };margin:0 0 8px 0;">${escapeHtml(text)}</div>`
}

export function kbdChip(value: string): string {
  return `<span style="display:inline-block;font-family:${
    FONTS.mono
  };font-size:13px;font-weight:500;color:${COLORS.foreground};background:${
    COLORS.chipBg
  };border:1px solid ${
    COLORS.border
  };border-radius:8px;padding:8px 12px;line-height:1.25;word-break:break-all;vertical-align:middle;">${escapeHtml(
    value,
  )}</span>`
}

export function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 18px 0;">
  <tr><td style="height:1px;line-height:1px;font-size:1px;background:${COLORS.border};">&nbsp;</td></tr>
</table>`
}

export function h1(text: string): string {
  return `<h1 class="lmcs-h1" style="margin:16px 0 14px 0;font-family:${
    FONTS.sans
  };font-size:26px;line-height:1.12;letter-spacing:-0.035em;font-weight:600;color:${
    COLORS.foreground
  };">${escapeHtml(text)}</h1>`
}

export interface ParagraphOptions {
  color?: string
  size?: number
  marginBottom?: number
}

export function p(text: string, options: ParagraphOptions = {}): string {
  const color = options.color ?? COLORS.body
  const size = options.size ?? 15
  const mb = options.marginBottom ?? 16
  return `<p style="margin:0 0 ${mb}px 0;font-family:${
    FONTS.sans
  };font-size:${size}px;line-height:1.62;color:${color};">${escapeHtml(
    text,
  )}</p>`
}

export function muted(text: string): string {
  return p(text, { color: COLORS.muted, size: 13, marginBottom: 8 })
}

/** Pull-quote line — sans italic (landing headlines are DM Sans, not serif). */
export function quoteHighlight(text: string): string {
  return `<p style="margin:0 0 22px 0;font-family:${
    FONTS.sans
  };font-style:italic;font-size:17px;line-height:1.45;font-weight:500;color:${
    COLORS.foreground
  };">${escapeHtml(`“${text}”`)}</p>`
}
