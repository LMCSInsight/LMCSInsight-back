import { describe, test, expect, beforeAll } from '@jest/globals'
import { createSupervision } from '../services/supervisions.js'
import { createStudent } from '../services/students.js'

describe('Supervisions Service Validations', () => {
  let createdStudentId: string

  beforeAll(async () => {
    // We need a valid student and chercheur for foreign key constraints
    // assuming prisma validates them.
    const student = await createStudent({
      firstName: 'Test',
      lastName: 'Student',
      email: `test_supervision_${Date.now()}@esi.dz`,
      institution: 'ESI' as const,
      level: 'MASTER' as const,
    })
    createdStudentId = student.id
  })

  test('createSupervision with all valid parameters should succeed', async () => {
    const supervisionInput = {
      title: 'Valid Supervision',
      type: 'PFE' as const,
      academicYear: '2023-2024',
      startDate: new Date().toISOString(),
      studentId: createdStudentId,
      description: 'A test supervision',
    }

    const creatorId = '00000000-0000-4000-8000-000000000000'
    const created = await createSupervision(supervisionInput, creatorId)
    expect(created.id).toBeDefined()
    expect(created.title).toBe(supervisionInput.title)
    expect(created.type).toBe('PFE')
    expect(created.academicYear).toBe(supervisionInput.academicYear)
    // Assistant/researcher entry flow: store submitter for audit (no auto main-supervisor row in create)
    expect(created.submittedByUserId).toBe(creatorId)
  })

  test('createSupervision without optional parameters should succeed', async () => {
    const supervisionInput = {
      title: 'Minimal Supervision',
      type: 'MASTER' as const,
      academicYear: '2023-2024',
      startDate: new Date().toISOString(),
      studentId: createdStudentId,
    }

    const created = await createSupervision(
      supervisionInput,
      '00000000-0000-4000-8000-000000000000',
    )
    expect(created.id).toBeDefined()
    expect(created.title).toBe(supervisionInput.title)
    expect(created.description).toBeUndefined()
  })

  test('createSupervision without title should fail validation', async () => {
    const supervisionInput = {
      title: '',
      type: 'MASTER' as const,
      academicYear: '2023-2024',
      startDate: new Date().toISOString(),
      studentId: createdStudentId,
    }

    await expect(
      createSupervision(
        supervisionInput,
        '00000000-0000-4000-8000-000000000000',
      ),
    ).rejects.toThrow('Title is required')
  })

  test('createSupervision with missing academic year should fail', async () => {
    const supervisionInput = {
      title: 'Missing academic year',
      type: 'MASTER',
      startDate: new Date().toISOString(),
      studentId: createdStudentId,
    } as unknown as Parameters<typeof createSupervision>[0]

    await expect(
      createSupervision(
        supervisionInput,
        '00000000-0000-4000-8000-000000000000',
      ),
    ).rejects.toThrow()
  })
})
