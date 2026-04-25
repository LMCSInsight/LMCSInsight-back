import { describe, test, expect } from '@jest/globals'
import {
  createStudent,
  deleteStudent,
  getStudents,
  getStudentById,
  updateStudent,
} from '../services/students.js'
import type { CreateStudentInput } from '../services/students.js'

function uniqueEmail(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}.${Date.now()}.${randomPart}@esi.dz`
}

function buildStudent(
  overrides: Partial<CreateStudentInput> = {},
): CreateStudentInput {
  return {
    firstName: 'Abderrahim',
    lastName: 'LARIBI',
    email: uniqueEmail('student'),
    institution: 'ESI',
    level: 'MASTER',
    specialty: 'SIL',
    ...overrides,
  }
}

describe('creating students', () => {
  test('with all parameters should succeed', async () => {
    const student = buildStudent()

    const createdStudent = await createStudent(student)
    expect(createdStudent.id).toBeDefined()
    expect(createdStudent.firstName).toBe(student.firstName)
    expect(createdStudent.lastName).toBe(student.lastName)
    expect(createdStudent.email).toBe(student.email)
    expect(createdStudent.institution).toBe(student.institution)
    expect(createdStudent.level).toBe(student.level)
    expect(createdStudent.specialty).toBe(student.specialty)
  })

  test('without optional parameters should succeed', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { specialty, ...student } = buildStudent()

    const createdStudent = await createStudent(student)
    expect(createdStudent.id).toBeDefined()
    expect(createdStudent.firstName).toBe(student.firstName)
    expect(createdStudent.lastName).toBe(student.lastName)
    expect(createdStudent.email).toBe(student.email)
    expect(createdStudent.institution).toBe(student.institution)
    expect(createdStudent.level).toBe(student.level)
    expect(createdStudent.specialty).toBeUndefined()
  })

  test('with invalid email should fail', async () => {
    const student = buildStudent({ email: 'invalid-email' })

    await expect(createStudent(student)).rejects.toThrow()
  })

  test('without firstName should fail', async () => {
    const student = buildStudent({ firstName: '' })

    await expect(createStudent(student)).rejects.toThrow(
      'firstName is required',
    )
  })

  test('without lastName should fail', async () => {
    const student = buildStudent({ lastName: '' })

    await expect(createStudent(student)).rejects.toThrow('lastName is required')
  })

  test('with invalid institution should fail', async () => {
    const student = buildStudent({ institution: 'INVALID' as 'ESI' })

    await expect(createStudent(student)).rejects.toThrow()
  })

  test('with invalid level should fail', async () => {
    const student = buildStudent({ level: 'L2' as 'MASTER' })

    await expect(createStudent(student)).rejects.toThrow()
  })

  test('with duplicate email should create both records in current test setup', async () => {
    const email = uniqueEmail('duplicate')
    const firstStudent = buildStudent({ email })
    const secondStudent = buildStudent({ email })

    const createdFirst = await createStudent(firstStudent)
    const createdSecond = await createStudent(secondStudent)

    expect(createdFirst.id).not.toBe(createdSecond.id)
    expect(createdSecond.email).toBe(email)
  })
})

describe('fetching students', () => {
  test('should return an array of students', async () => {
    const page = await getStudents()
    expect(Array.isArray(page.data)).toBe(true)
  })

  test('should contain recently created students', async () => {
    const firstStudent = await createStudent(
      buildStudent({ firstName: 'First' }),
    )
    const secondStudent = await createStudent(
      buildStudent({ firstName: 'Second' }),
    )

    const result = await getStudents()
    const studentIds = result.data.map((student) => student.id)

    expect(studentIds).toContain(firstStudent.id)
    expect(studentIds).toContain(secondStudent.id)
  })
})

describe('fetching student by id', () => {
  test('should return the student if it exists', async () => {
    const studentData = buildStudent({
      firstName: 'Youcef',
      lastName: 'AMERELKHEDOUD',
    })

    const createdStudent = await createStudent(studentData)

    const fetchedStudent = await getStudentById(createdStudent.id)

    expect(fetchedStudent).not.toBeNull()
    expect(fetchedStudent?.id).toBe(createdStudent.id)
    expect(fetchedStudent?.firstName).toBe(studentData.firstName)
    expect(fetchedStudent?.lastName).toBe(studentData.lastName)
    expect(fetchedStudent?.email).toBe(studentData.email)
    expect(fetchedStudent?.institution).toBe(studentData.institution)
    expect(fetchedStudent?.level).toBe(studentData.level)
  })

  test('should return null if the student does not exist', async () => {
    const nonexistentID = 'non-existent-id'
    const fetchedStudent = await getStudentById(nonexistentID)

    expect(fetchedStudent).toBeNull()
  })

  test('should return the updated version of a student', async () => {
    const createdStudent = await createStudent(buildStudent())
    const updatedEmail = uniqueEmail('updated')

    await updateStudent(createdStudent.id, {
      firstName: 'Updated Name',
      email: updatedEmail,
    })

    const fetchedStudent = await getStudentById(createdStudent.id)
    expect(fetchedStudent).not.toBeNull()
    expect(fetchedStudent?.firstName).toBe('Updated Name')
    expect(fetchedStudent?.email).toBe(updatedEmail)
  })
})

describe('updating student', () => {
  test('should update the student successfully', async () => {
    const studentData = buildStudent({
      firstName: 'Youcef',
      lastName: 'AMERELKHEDOUD',
    })

    const createdStudent = await createStudent(studentData)

    const updatedData = {
      firstName: 'Youcef Updated',
      level: 'DOCTORANT' as const,
    }

    const updatedStudent = await updateStudent(createdStudent.id, updatedData)

    expect(updatedStudent.id).toBe(createdStudent.id)
    expect(updatedStudent.firstName).toBe(updatedData.firstName)
    expect(updatedStudent.level).toBe(updatedData.level)
    expect(updatedStudent.lastName).toBe(studentData.lastName)
  })

  test('with invalid email should fail', async () => {
    const createdStudent = await createStudent(buildStudent())

    await expect(
      updateStudent(createdStudent.id, { email: 'not-an-email' }),
    ).rejects.toThrow()
  })

  test('for a non-existing student should return null', async () => {
    const updatedStudent = await updateStudent('non-existent-id', {
      firstName: 'Nobody',
    })

    expect(updatedStudent).toBeNull()
  })
})

describe('deleting student', () => {
  test('should delete the student successfully', async () => {
    const createdStudent = await createStudent(buildStudent())

    const deletedStudent = await deleteStudent(createdStudent.id)
    expect(deletedStudent.id).toBe(createdStudent.id)

    const fetchedStudent = await getStudentById(createdStudent.id)
    expect(fetchedStudent).toBeNull()
  })

  test('for a non-existing student should return null', async () => {
    const deletedStudent = await deleteStudent('non-existent-id')
    expect(deletedStudent).toBeNull()
  })
})
