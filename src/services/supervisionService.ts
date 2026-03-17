import * as supervisionRepository from "../db/repositories/supervisionRepository.js";
import * as studentRepository from "../db/repositories/studentRepository.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";
import type { SupervisionSearchFilters } from "../types/supervisionTypes.js";

export async function createSupervision(data: {
  title: string;
  type: string;
  description?: string | null;
  startDate: Date;
  expectedEndDate?: Date | null;
  themeId?: string | null;
  keywords?: string[];
  academicYear: string;
  studentId: string;
  supervisorIds: string[];
  contributionPercents?: number[];
  mainSupervisorIndex?: number;
}) {
  const student = await studentRepository.findById(data.studentId);
  if (!student) {
    throw new Error("Student not found");
  }
  const supervisors = data.supervisorIds.map((supervisorId, i) => ({
    supervisorId,
    contributionPercent: data.contributionPercents?.[i] ?? 100,
    isMainSupervisor: data.mainSupervisorIndex === i,
    isExternal: false,
  }));
  return supervisionRepository.create({
    title: data.title,
    type: data.type as "PFE" | "MASTER" | "PHD" | "INTERNSHIP" | "PROJECT",
    description: data.description ?? null,
    startDate: data.startDate,
    expectedEndDate: data.expectedEndDate ?? null,
    themeId: data.themeId ?? null,
    keywords: data.keywords ?? [],
    academicYear: data.academicYear,
    studentId: data.studentId,
    supervisors,
  });
}

export async function updateSupervision(
  id: string,
  data: {
    title?: string;
    type?: string;
    description?: string | null;
    startDate?: Date;
    expectedEndDate?: Date | null;
    actualEndDate?: Date | null;
    status?: string;
    validationStatus?: string;
    themeId?: string | null;
    keywords?: string[];
    academicYear?: string;
    studentId?: string;
  }
) {
  const existing = await supervisionRepository.findById(id);
  if (!existing) {
    throw new Error("Supervision not found");
  }
  return supervisionRepository.update(id, {
    ...data,
    type: data.type as "PFE" | "MASTER" | "PHD" | "INTERNSHIP" | "PROJECT" | undefined,
    status: data.status as "IN_PROGRESS" | "DEFENDED" | "ABANDONED" | "EXTENSION" | "SUSPENDED" | undefined,
    validationStatus: data.validationStatus as "PENDING" | "VALIDATED" | "REJECTED" | "REVISED" | undefined,
  });
}

export async function deleteSupervision(id: string) {
  const existing = await supervisionRepository.findById(id);
  if (!existing) {
    throw new Error("Supervision not found");
  }
  return supervisionRepository.deleteById(id);
}

export async function getSupervisionById(id: string) {
  const supervision = await supervisionRepository.findById(id);
  if (!supervision) {
    throw new Error("Supervision not found");
  }
  return supervision;
}

export async function getSupervisions(
  page: number,
  pageSize: number,
  _userId?: string,
  role?: string,
  chercheurId?: string | null
) {
  const { skip, take } = getPagination({ page, pageSize });
  const where =
    role === "TEACHER" && chercheurId
      ? { supervisors: { some: { supervisorId: chercheurId } } }
      : undefined;
  const [items, total] = await Promise.all([
    supervisionRepository.findAll(skip, take, where),
    supervisionRepository.count(where),
  ]);
  return { items, meta: paginationMeta(total, page, pageSize) };
}

export async function searchSupervisions(filters: SupervisionSearchFilters) {
  const { page = 1, pageSize = 10, ...rest } = filters;
  const skip = (page - 1) * pageSize;
  const { items, total } = await supervisionRepository.search({ ...rest, skip, take: pageSize });
  return { items, meta: paginationMeta(total, page, pageSize) };
}

export async function addCoSupervisor(
  supervisionId: string,
  supervisorId: string,
  options?: { contributionPercent?: number; isMainSupervisor?: boolean; isExternal?: boolean }
) {
  const supervision = await supervisionRepository.findById(supervisionId);
  if (!supervision) {
    throw new Error("Supervision not found");
  }
  return supervisionRepository.addSupervisor(supervisionId, supervisorId, options);
}

export const supervisionService = {
  createSupervision,
  updateSupervision,
  deleteSupervision,
  getSupervisionById,
  getSupervisions,
  searchSupervisions,
  addCoSupervisor,
};
