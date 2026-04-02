import { describe, expect, test } from '@jest/globals'

describe('students test environment', () => {
  test('pg-mem hooks are configured and running', async () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(global.__PGMEM_DB__).toBeDefined()
    expect(global.__PG_CLIENT__).toBeDefined()

    const result = await global.__PG_CLIENT__.query('SELECT 1 AS ok')
    expect(result.rows[0].ok).toBe(1)
  })
})
