import type { User, UserRole } from "@prisma/client";
import { prisma } from "../prisma.js";

export async function create(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: UserRole;
    phoneNumber?: string | null;
    chercheur_id?: string | null;
    teamId?: string | null;
  }
): Promise<User> {
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: data.role ?? "RESEARCHER",
      phoneNumber: data.phoneNumber ?? null,
      chercheur_id: data.chercheur_id ?? null,
      teamId: data.teamId ?? null,
    },
  });
}

export async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function findByIdWithChercheur(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { chercheur: true },
  });
}

export async function update(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    phoneNumber?: string | null;
    isActive?: boolean;
    chercheur_id?: string | null;
    teamId?: string | null;
  }
): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}

export async function deleteById(id: string): Promise<User> {
  return prisma.user.delete({ where: { id } });
}

export async function findAll(skip: number, take: number): Promise<User[]> {
  return prisma.user.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      chercheur_id: true,
      createdAt: true,
    },
  }) as Promise<User[]>;
}

export async function count(): Promise<number> {
  return prisma.user.count();
}
