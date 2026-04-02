import { describe, expect, test } from '@jest/globals'

describe('students test environment', () => {
  test('jest hooks are configured and running', async () => {
    expect(process.env.NODE_ENV).toBe('test')
  })
})
