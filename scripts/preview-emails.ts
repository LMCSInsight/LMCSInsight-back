/**
 * Smoke-render both email templates with sample data and write the result
 * to backend/email-preview.html. Open in any browser to eyeball the layout
 * before sending. Safe to delete this script and the generated file once
 * the templates look right.
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderNewUserCredentialsEmail } from '../src/services/emailTemplates/newUserCredentials.js'
import { renderSupervisionAssignedEmail } from '../src/services/emailTemplates/supervisionAssigned.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(here, '..')
mkdirSync(outDir, { recursive: true })

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

const previewPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>LMCS Insight — email preview</title>
  <style>
    body { margin:0; padding:32px; background:#EFEEEA; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#111; }
    h2 { margin:0 0 12px 0; font-size:13px; letter-spacing:0.18em; text-transform:uppercase; color:#52524E; }
    .pair { display:grid; grid-template-columns:1fr; gap:48px; max-width:680px; margin:0 auto; }
    .frame { border:1px solid #E2E1DC; background:#FBFBFA; }
    iframe { display:block; width:100%; height:1100px; border:0; background:#FBFBFA; }
    .meta { padding:16px 20px; border-top:1px solid #E2E1DC; font-family:ui-monospace,'SF Mono',Menlo,monospace; font-size:12px; color:#52524E; }
    .meta b { color:#111; font-weight:600; }
  </style>
</head>
<body>
<div class="pair">
  <section>
    <h2>New user credentials</h2>
    <div class="frame">
      <iframe srcdoc="${credentials.html.replace(/"/g, '&quot;')}"></iframe>
      <div class="meta"><b>Subject:</b> ${credentials.subject}</div>
    </div>
  </section>
  <section>
    <h2>Supervision assigned</h2>
    <div class="frame">
      <iframe srcdoc="${supervision.html.replace(/"/g, '&quot;')}"></iframe>
      <div class="meta"><b>Subject:</b> ${supervision.subject}</div>
    </div>
  </section>
</div>
</body>
</html>`

const outPath = path.join(outDir, 'email-preview.html')
writeFileSync(outPath, previewPage, 'utf8')
console.log(`Wrote ${outPath}`)
