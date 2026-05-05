/**
 * Load env from repo root `.env` first, then `backend/.env` (overrides).
 * Ensures SMTP / APP_PUBLIC_URL can live in the monorepo root while DATABASE_URL stays in backend/.env.
 */
import { existsSync } from 'fs'
import path from 'path'
import { config } from 'dotenv'

const cwd = process.cwd()
const backendEnv = path.resolve(cwd, '.env')
const rootEnv = path.resolve(cwd, '..', '.env')

if (existsSync(rootEnv)) {
  config({ path: rootEnv })
}
if (existsSync(backendEnv)) {
  config({ path: backendEnv, override: true })
}
