import type { UserRole } from "@prisma/client";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  chercheur_id?: string | null;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  chercheur_id?: string | null;
  createdAt: Date;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
