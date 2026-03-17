import { z } from "zod";

const supervisionTypeEnum = z.enum(["PFE", "MASTER", "PHD", "INTERNSHIP", "PROJECT"]);
const supervisionStatusEnum = z.enum(["IN_PROGRESS", "DEFENDED", "ABANDONED", "EXTENSION", "SUSPENDED"]);
const validationStatusEnum = z.enum(["PENDING", "VALIDATED", "REJECTED", "REVISED"]);

export const createSupervisionSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    type: supervisionTypeEnum,
    description: z.string().optional().nullable(),
    startDate: z.coerce.date(),
    expectedEndDate: z.coerce.date().optional().nullable(),
    themeId: z.string().uuid().optional().nullable(),
    keywords: z.array(z.string()).optional().default([]),
    academicYear: z.string().min(1, "Academic year is required"),
    studentId: z.string().min(1, "Student is required"),
    supervisorIds: z.array(z.string()).min(1, "At least one supervisor (chercheur_id) is required"),
    contributionPercents: z.array(z.number().min(0).max(100)).optional(),
    mainSupervisorIndex: z.number().int().min(0).optional(),
  }),
});

export const updateSupervisionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z
    .object({
      title: z.string().min(1).optional(),
      type: supervisionTypeEnum.optional(),
      description: z.string().optional().nullable(),
      startDate: z.coerce.date().optional(),
      expectedEndDate: z.coerce.date().optional().nullable(),
      actualEndDate: z.coerce.date().optional().nullable(),
      status: supervisionStatusEnum.optional(),
      validationStatus: validationStatusEnum.optional(),
      themeId: z.string().uuid().optional().nullable(),
      keywords: z.array(z.string()).optional(),
      academicYear: z.string().optional(),
      studentId: z.string().optional(),
    })
    .strict(),
});

export const searchSupervisionSchema = z.object({
  query: z.object({
    chercheurId: z.string().optional(),
    themeId: z.string().uuid().optional(),
    type: supervisionTypeEnum.optional(),
    academicYear: z.string().optional(),
    status: supervisionStatusEnum.optional(),
    validationStatus: validationStatusEnum.optional(),
    keywords: z.string().optional(),
    page: z.coerce.number().min(1).optional(),
    pageSize: z.coerce.number().min(1).max(100).optional(),
  }),
});
