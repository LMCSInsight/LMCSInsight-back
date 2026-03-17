import type { Student } from "@prisma/client";

export type { Student };

export interface StudentCreateInput {
  firstName: string;
  lastName: string;
  email?: string;
  institution: string;
  level: string;
  specialty?: string;
}

export interface StudentUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  institution?: string;
  level?: string;
  specialty?: string;
}
