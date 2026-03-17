import type { Student } from "@prisma/client";
import { prisma } from "../prisma.js";
import type { StudentCreateInput, StudentUpdateInput } from "../../types/studentTypes.js";

export async function create(data: StudentCreateInput): Promise<Student> {
  return prisma.student.create({ data });
}

export async function update(id: string, data: StudentUpdateInput): Promise<Student> {
  return prisma.student.update({ where: { id }, data });
}

export async function deleteById(id: string): Promise<Student> {
  return prisma.student.delete({ where: { id } });
}

export async function findById(id: string): Promise<Student | null> {
  return prisma.student.findUnique({ where: { id } });
}

export async function findAll(skip: number, take: number, search?: string) {
  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.student.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.student.count({ where }),
  ]);
  return { items, total };
}

export async function count(): Promise<number> {
  return prisma.student.count();
}
