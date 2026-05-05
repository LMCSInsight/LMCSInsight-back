/**
 * Writes static HTML + plain-text copies of transactional emails under
 * backend/mail-template/ using fixed mock data (demos only; not live email).
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderNewUserCredentialsEmail } from '../src/services/emailTemplates/newUserCredentials.js'
import { renderSupervisionAssignedEmail } from '../src/services/emailTemplates/supervisionAssigned.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(here, '..', 'mail-template')
mkdirSync(outDir, { recursive: true })

process.env.APP_PUBLIC_URL = 'http://localhost:5173'

const banner =
  '<!-- LMCS Insight — static demo export (mock data only; not production). -->\n'

const credentials = renderNewUserCredentialsEmail({
  firstName: 'Yacine',
  email: 'y.benbouzid@esi.dz',
  password: 'Tx9-quartz-meridian',
  loginUrl: 'http://localhost:5173/login',
})

const supervision = renderSupervisionAssignedEmail({
  supervisionTitle:
    'Détection d\u2019anomalies dans les flux IoT par apprentissage profond',
  supervisionId: 'SUP-2026-04711',
  loginUrl: 'http://localhost:5173/login',
})

const txtPrefix = `[DEMO — mock data only]\nSubject: `

writeFileSync(
  path.join(outDir, 'new-user-credentials.html'),
  banner + credentials.html,
  'utf8',
)
writeFileSync(
  path.join(outDir, 'new-user-credentials.txt'),
  `${txtPrefix}${credentials.subject}\n\n${credentials.text}`,
  'utf8',
)

writeFileSync(
  path.join(outDir, 'supervision-assigned.html'),
  banner + supervision.html,
  'utf8',
)
writeFileSync(
  path.join(outDir, 'supervision-assigned.txt'),
  `${txtPrefix}${supervision.subject}\n\n${supervision.text}`,
  'utf8',
)

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LMCS Insight — mail template demos</title>
  <style>
    body { margin:0; padding:40px 24px; font-family: system-ui, sans-serif; background:#f1f5f9; color:#0f172a; }
    main { max-width: 520px; margin: 0 auto; }
    h1 { font-size: 1.125rem; font-weight: 600; margin: 0 0 8px 0; }
    p { margin: 0 0 20px 0; color: #475569; font-size: 0.875rem; line-height: 1.5; }
    ul { margin: 0; padding: 0; list-style: none; }
    li { margin-bottom: 12px; }
    a { color: #3358e6; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .tag { display: inline-block; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
  </style>
</head>
<body>
<main>
  <span class="tag">Demo only</span>
  <h1>Exported mail templates</h1>
  <p>Static previews with mock data. Regenerate with <code>npm run mail-template:export</code> from <code>backend/</code>.</p>
  <ul>
    <li>
      <a href="./new-user-credentials.html">New user credentials</a>
      <div class="sub">Subject: ${escapeHtml(credentials.subject)}</div>
    </li>
    <li>
      <a href="./supervision-assigned.html">Supervision assigned</a>
      <div class="sub">Subject: ${escapeHtml(supervision.subject)}</div>
    </li>
  </ul>
</main>
</body>
</html>
`

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8')

console.log(`Wrote demo templates under ${outDir}`)
