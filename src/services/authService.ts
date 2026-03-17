import * as userRepository from "../db/repositories/userRepository.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";
import type { AuthUser, LoginResponse } from "../types/authTypes.js";
import type { RegisterInput, LoginInput } from "../validators/authValidator.js";

function toAuthUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  chercheur_id?: string | null;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as AuthUser["role"],
    chercheur_id: user.chercheur_id ?? null,
    createdAt: user.createdAt,
  };
}

export async function register(input: RegisterInput): Promise<LoginResponse> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new Error("User with this email already exists");
  }
  const passwordHash = await hashPassword(input.password);
  const user = await userRepository.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: passwordHash,
    role: input.role,
    phoneNumber: input.phoneNumber ?? undefined,
    chercheur_id: input.chercheur_id ?? undefined,
  });
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    chercheur_id: user.chercheur_id,
  });
  return { token, user: toAuthUser(user) };
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const user = await userRepository.findByEmail(input.email);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const valid = await comparePassword(input.password, user.password);
  if (!valid) {
    throw new Error("Invalid email or password");
  }
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    chercheur_id: user.chercheur_id,
  });
  return { token, user: toAuthUser(user) };
}

export const authService = { register, login };
