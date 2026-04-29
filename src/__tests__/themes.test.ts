import { describe, test, expect } from '@jest/globals'
import { z } from 'zod'
import {
  createTheme,
  createThemeSchema,
  deleteTheme,
  getThemeById,
  getThemes,
  updateTheme,
  updateThemeSchema,
} from '../services/themes.js'

describe('createThemeSchema', () => {
  test('accepts name only', () => {
    const v = createThemeSchema.parse({ name: 'IA & vision' })
    expect(v.name).toBe('IA & vision')
  })

  test('rejects empty name', () => {
    expect(() => createThemeSchema.parse({ name: '' })).toThrow()
  })
})

describe('updateThemeSchema', () => {
  test('accepts partial fields', () => {
    const v = updateThemeSchema.parse({ name: 'X' })
    expect(v.name).toBe('X')
  })
})

describe('themes service (mocked ThemeModel)', () => {
  test('createTheme basic create', async () => {
    const t = await createTheme({ name: 'Thème A' })
    expect(t.id).toBeDefined()
    expect(t.name).toBe('Thème A')
  })

  test('getThemes returns page', async () => {
    const page = await getThemes({ page: 1, limit: 10 })
    expect(page.page).toBe(1)
    expect(page.limit).toBe(10)
    expect(Array.isArray(page.data)).toBe(true)
  })

  test('getThemeById and deleteTheme', async () => {
    const t = await createTheme({ name: 'To remove' })
    const got = await getThemeById(t.id)
    expect(got).not.toBeNull()
    expect((got as { name: string }).name).toBe('To remove')

    const del = await deleteTheme(t.id)
    expect((del as { id: string; name: string }).id).toBe(t.id)
    const gone = await getThemeById(t.id)
    expect(gone).toBeNull()
  })

  test('updateTheme applies changes', async () => {
    const t = await createTheme({ name: 'Old' })
    const u = await updateTheme(t.id, { name: 'New', description: 'Desc' })
    expect((u as { name: string; description: string }).name).toBe('New')
    expect((u as { description: string }).description).toBe('Desc')
  })

  test('updateTheme with empty object throws', async () => {
    const t = await createTheme({ name: 'E' })
    await expect(
      updateTheme(t.id, {} as z.infer<typeof updateThemeSchema>),
    ).rejects.toThrow('EMPTY_UPDATE')
  })
})
