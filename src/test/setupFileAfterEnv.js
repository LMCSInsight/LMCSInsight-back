import { afterAll, beforeAll, beforeEach } from '@jest/globals'
import 'dotenv/config'

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
})

beforeEach(async () => {
  // Shared per-test setup hook.
})

afterAll(async () => {
  // Shared post-test cleanup hook.
})
