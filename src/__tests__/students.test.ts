import { describe, test, expect } from '@jest/globals'
import { createStudent, getStudentByIdId, getStudents } from '../services/students.js' // your service

describe('creating students', () => {
  test('with all parameters should succeed', async () => {
    const student = {
      firstName: 'Abderrahim',
      lastName: 'LARIBI',
      email: 'na_laribi@esi.dz',
      institution: 'ESI Algiers',
      level: 'L2',
      specialty: 'Computer Science',
    }

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
    const student = {
      firstName: 'Abderrahim',
      lastName: 'LARIBI',
      email: 'na_laribi@esi.dz',
      institution: 'ESI Algiers',
      level: 'L2',
    }

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
    const student = {
      firstName: 'Abderrahim',
      lastName: 'LARIBI',
      email: 'invalid-email',
      institution: 'ESI Algiers',
      level: 'L2',
    }

    await expect(createStudent(student)).rejects.toThrow()
  })

  test('without firstName should fail', async () => {
    const student = {
      firstName: '',
      lastName: 'LARIBI',
      email: 'na_laribi@esi.dz',
      institution: 'ESI Algiers',
      level: 'L2',
    }

    await expect(createStudent(student)).rejects.toThrow(
      'firstName is required',
    )
  })

  test('without institution should fail', async () => {
    const student = {
      firstName: 'Abderrahim',
      lastName: 'LARIBI',
      email: 'na_laribi@esi.dz',
      institution: '',
      level: 'L2',
    }

    await expect(createStudent(student)).rejects.toThrow(
      'institution is required',
    )
  })

  test('without level should fail', async () => {
    const student = {
      firstName: 'Abderrahim',
      lastName: 'LARIBI',
      email: 'na_laribi@esi.dz',
      institution: 'ESI Algiers',
      level: '',
    }

    await expect(createStudent(student)).rejects.toThrow('level is required')
  })
})

describe('fetching students', () => {
  test('should return an array of students', async () => {
    const students = await getStudents()
    expect(Array.isArray(students)).toBe(true)
  })
})

describe('fetching student by id', () => {
  test('should return the student if it exists', async () =>
  {
    const studentData = {
      firstName: 'Youcef',
      lastName: 'AMERELKHEDOUD',
      email: 'oy_amerelkhedoud@esi.dz',
      institution: 'ESI Algiers',
      level: 'L2',
      specialty: 'Computer Science',
    }

    const createdStudent = await createStudent(studentData)

    const fetchedStudent = await getStudentByIdId(createdStudent.id)
    
    expect(fetchedStudent).not.toBeNull()
    expect(fetchedStudent?.id).toBe(createdStudent.id)
    expect(fetchedStudent?.firstName).toBe(studentData.firstName)
    expect(fetchedStudent?.lastName).toBe(studentData.lastName)
    expect(fetchedStudent?.email).toBe(studentData.email)
    expect(fetchedStudent?.institution).toBe(studentData.institution)
    expect(fetchedStudent?.level).toBe(studentData.level)
  })

  test('should return null if the student does not exist', async () => 
    {
    const nonexistentID = 'non-existent-id'
    const fetchedStudent = await getStudentByIdId(nonexistentID)

    expect(fetchedStudent).toBeNull()
    })
})
