import * as userRepository from "../db/repositories/userRepository.js";
import { getPagination } from "../utils/pagination.js";
import { hashPassword } from "../utils/hash.js";
import type { UserRole } from "@prisma/client";

export async function getUsers(page: number, pageSize: number) {
  const { skip, take } = getPagination({ page, pageSize });
  const [items, total] = await Promise.all([
    userRepository.findAll(skip, take),
    userRepository.count(),
  ]);
  return { items, total, page, pageSize };
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber?: string | null;
  chercheur_id?: string | null;
}) {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) {
    throw new Error("User with this email already exists");
  }
  const passwordHash = await hashPassword(data.password);
  return userRepository.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: passwordHash,
    role: data.role,
    phoneNumber: data.phoneNumber ?? undefined,
    chercheur_id: data.chercheur_id ?? undefined,
  });
}

export async function updateUser(
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
  }
) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  const updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    phoneNumber?: string | null;
    isActive?: boolean;
    chercheur_id?: string | null;
  } = { ...data };
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
  if (data.chercheur_id !== undefined) updateData.chercheur_id = data.chercheur_id;
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }
  return userRepository.update(id, updateData);
}

export async function deleteUser(id: string) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return userRepository.deleteById(id);
}
