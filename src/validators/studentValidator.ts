import { z } from "zod";

export const createStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email().optional().nullable(),
    institution: z.string().min(1, "Institution is required"),
    level: z.string().min(1, "Level is required"),
    specialty: z.string().optional().nullable(),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional().nullable(),
      institution: z.string().min(1).optional(),
      level: z.string().min(1).optional(),
      specialty: z.string().optional().nullable(),
    })
    .strict(),
});
