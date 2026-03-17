import * as studentRepository from "../db/repositories/studentRepository.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";
import type { StudentCreateInput, StudentUpdateInput } from "../types/studentTypes.js";

export async function createStudent(data: StudentCreateInput) {
  return studentRepository.create(data);
}

export async function updateStudent(id: string, data: StudentUpdateInput) {
  const existing = await studentRepository.findById(id);
  if (!existing) {
    throw new Error("Student not found");
  }
  return studentRepository.update(id, data);
}

export async function deleteStudent(id: string) {
  const existing = await studentRepository.findById(id);
  if (!existing) {
    throw new Error("Student not found");
  }
  return studentRepository.deleteById(id);
}

export async function getStudentById(id: string) {
  const student = await studentRepository.findById(id);
  if (!student) {
    throw new Error("Student not found");
  }
  return student;
}

export async function getStudents(page: number, pageSize: number, search?: string) {
  const { skip, take } = getPagination({ page, pageSize });
  const { items, total } = await studentRepository.findAll(skip, take, search);
  return { items, meta: paginationMeta(total, page, pageSize) };
}

export const studentService = {
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentById,
  getStudents,
};
