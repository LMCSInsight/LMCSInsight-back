import type { UserRole } from "@prisma/client";

export const ROLES = {
  ADMIN: "ADMIN" as UserRole,
  DIRECTOR: "DIRECTOR" as UserRole,
  RESEARCHER: "RESEARCHER" as UserRole,
  ASSISTANT: "ASSISTANT" as UserRole,
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];
