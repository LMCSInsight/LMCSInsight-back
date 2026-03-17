import { prisma } from "../prisma.js";
import type { SupervisionStatus, ValidationStatus } from "@prisma/client";

const supervisorInclude = {
  supervisor: {
    select: { chercheur_id: true, nom_complet: true, qualite: true },
  },
};

/** Supervisions pending data validation (validationStatus === PENDING) */
export async function findPendingSupervisions(skip: number, take: number) {
  return prisma.supervision.findMany({
    where: { validationStatus: "PENDING" },
    skip,
    take,
    orderBy: { createdAt: "asc" },
    include: {
      student: true,
      theme: { select: { id: true, name: true } },
      supervisors: { include: supervisorInclude },
    },
  });
}

export async function countPending(): Promise<number> {
  return prisma.supervision.count({ where: { validationStatus: "PENDING" } });
}

/** Update supervision lifecycle status (IN_PROGRESS -> DEFENDED, etc.) */
export async function updateStatus(supervisionId: string, status: SupervisionStatus) {
  return prisma.supervision.update({
    where: { id: supervisionId },
    data: { status, ...(status === "DEFENDED" ? { actualEndDate: new Date() } : {}) },
  });
}

/** Update data validation status and create audit log entry */
export async function updateValidationStatus(
  supervisionId: string,
  data: {
    validationStatus: ValidationStatus;
    validationNotes?: string | null;
    validatorId: string;
    comments?: string | null;
    fieldsChecked?: object | null;
    issues?: object | null;
  }
) {
  const { validatorId, comments, fieldsChecked, issues, ...supervisionData } = data;
  await prisma.$transaction([
    prisma.supervision.update({
      where: { id: supervisionId },
      data: {
        ...supervisionData,
        validatedAt: new Date(),
      },
    }),
    prisma.validationLog.create({
      data: {
        supervisionId,
        validatorId,
        status: data.validationStatus,
        comments: comments ?? null,
        fieldsChecked: fieldsChecked ?? undefined,
        issues: issues ?? undefined,
      },
    }),
  ]);
  return prisma.supervision.findUnique({
    where: { id: supervisionId },
    include: {
      student: true,
      theme: true,
      supervisors: { include: supervisorInclude },
    },
  });
}
