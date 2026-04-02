import 'dotenv/config'

export default async function globalSetup() {
  process.env.NODE_ENV = 'test'

  // Prefer a dedicated test DB if provided.
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  }

  // Guardrail: never run destructive test cleanup without a DB URL.
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required for tests. Set it in backend/.env before running npm test.',
    )
  }
}
