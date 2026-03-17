import type {
  Supervision,
  SupervisionStatus,
  SupervisionType,
  ValidationStatus,
} from "@prisma/client";
import { prisma } from "../prisma.js";
import type { SupervisionSearchFilters } from "../../types/supervisionTypes.js";

export interface CreateSupervisorInput {
  supervisorId: string;
  contributionPercent?: number;
  isMainSupervisor?: boolean;
  isExternal?: boolean;
}

export async function create(data: {
  title: string;
  type: SupervisionType;
  description?: string | null;
  startDate: Date;
  expectedEndDate?: Date | null;
  status?: SupervisionStatus;
  validationStatus?: ValidationStatus;
  academicYear: string;
  keywords?: string[];
  themeId?: string | null;
  studentId: string;
  supervisors: CreateSupervisorInput[];
}): Promise<Supervision> {
  const { supervisors, ...rest } = data;
  return prisma.supervision.create({
    data: {
      ...rest,
      keywords: rest.keywords ?? [],
      supervisors: {
        create: supervisors.map((s) => ({
          supervisorId: s.supervisorId,
          contributionPercent: s.contributionPercent ?? 100,
          isMainSupervisor: s.isMainSupervisor ?? false,
          isExternal: s.isExternal ?? false,
        })),
      },
    },
  });
}

export async function update(
  id: string,
  data: {
    title?: string;
    type?: SupervisionType;
    description?: string | null;
    startDate?: Date;
    expectedEndDate?: Date | null;
    actualEndDate?: Date | null;
    status?: SupervisionStatus;
    validationStatus?: ValidationStatus;
    validatedAt?: Date | null;
    validationNotes?: string | null;
    academicYear?: string;
    keywords?: string[];
    themeId?: string | null;
    studentId?: string;
  }
): Promise<Supervision> {
  return prisma.supervision.update({ where: { id }, data });
}

export async function deleteById(id: string): Promise<Supervision> {
  return prisma.supervision.delete({ where: { id } });
}

const supervisorInclude = {
  supervisor: {
    select: { chercheur_id: true, nom_complet: true, qualite: true },
  },
};

export async function findById(id: string) {
  return prisma.supervision.findUnique({
    where: { id },
    include: {
      student: true,
      theme: { select: { id: true, name: true } },
      supervisors: { include: supervisorInclude },
    },
  });
}

export async function findAll(skip: number, take: number, where?: object) {
  return prisma.supervision.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      student: true,
      theme: { select: { id: true, name: true } },
      supervisors: { include: supervisorInclude },
    },
  });
}

export async function count(where?: object): Promise<number> {
  return prisma.supervision.count({ where });
}

export async function search(filters: SupervisionSearchFilters) {
  const {
    chercheurId,
    themeId,
    type,
    academicYear,
    status,
    validationStatus,
    keywords,
    skip = 0,
    take = 10,
  } = filters;
  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (academicYear) where.academicYear = academicYear;
  if (status) where.status = status;
  if (validationStatus) where.validationStatus = validationStatus;
  if (themeId) where.themeId = themeId;
  if (keywords) {
    where.OR = [
      { title: { contains: keywords, mode: "insensitive" } },
      { description: { contains: keywords, mode: "insensitive" } },
      { keywords: { has: keywords } },
    ];
  }
  if (chercheurId) {
    where.supervisors = { some: { supervisorId: chercheurId } };
  }
  const [items, total] = await Promise.all([
    prisma.supervision.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        student: true,
        theme: { select: { id: true, name: true } },
        supervisors: { include: supervisorInclude },
      },
    }),
    prisma.supervision.count({ where }),
  ]);
  return { items, total };
}

export async function addSupervisor(
  supervisionId: string,
  supervisorId: string,
  options?: { contributionPercent?: number; isMainSupervisor?: boolean; isExternal?: boolean }
) {
  return prisma.supervisionSupervisor.create({
    data: {
      supervisionId,
      supervisorId,
      contributionPercent: options?.contributionPercent ?? 100,
      isMainSupervisor: options?.isMainSupervisor ?? false,
      isExternal: options?.isExternal ?? false,
    },
  });
}
