import type { SupervisionStatus, SupervisionType } from "@prisma/client";

export const SUPERVISION_TYPES = {
  PFE: "PFE" as SupervisionType,
  MASTER: "MASTER" as SupervisionType,
  PHD: "PHD" as SupervisionType,
  INTERNSHIP: "INTERNSHIP" as SupervisionType,
  PROJECT: "PROJECT" as SupervisionType,
} as const;

export const SUPERVISION_STATUSES = {
  IN_PROGRESS: "IN_PROGRESS" as SupervisionStatus,
  DEFENDED: "DEFENDED" as SupervisionStatus,
  ABANDONED: "ABANDONED" as SupervisionStatus,
  EXTENSION: "EXTENSION" as SupervisionStatus,
  SUSPENDED: "SUSPENDED" as SupervisionStatus,
} as const;
