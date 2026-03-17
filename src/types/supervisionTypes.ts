import type {
  Supervision,
  SupervisionStatus,
  SupervisionType,
  ValidationStatus,
  Chercheur,
} from "@prisma/client";

export interface SupervisionWithRelations extends Supervision {
  student: { id: string; firstName: string; lastName: string; email: string | null; institution: string; level: string };
  theme?: { id: string; name: string } | null;
  supervisors: Array<{
    supervisorId: string;
    contributionPercent: number;
    isMainSupervisor: boolean;
    isExternal: boolean;
    supervisor: Pick<Chercheur, "chercheur_id" | "nom_complet" | "qualite">;
  }>;
}

export interface SupervisionSearchFilters {
  chercheurId?: string;
  themeId?: string;
  type?: SupervisionType;
  academicYear?: string;
  status?: SupervisionStatus;
  validationStatus?: ValidationStatus;
  keywords?: string;
  skip?: number;
  take?: number;
  page?: number;
  pageSize?: number;
}

export type { Supervision, SupervisionStatus, SupervisionType, ValidationStatus };
