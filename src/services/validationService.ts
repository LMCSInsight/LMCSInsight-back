import * as validationRepository from "../db/repositories/validationRepository.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";

export async function getPendingSupervisions(page: number, pageSize: number) {
  const { skip, take } = getPagination({ page, pageSize });
  const items = await validationRepository.findPendingSupervisions(skip, take);
  const total = await validationRepository.countPending();
  return { items, meta: paginationMeta(total, page, pageSize) };
}

/** Update supervision lifecycle status (IN_PROGRESS -> DEFENDED, etc.) */
export async function updateSupervisionStatus(
  supervisionId: string,
  status: "DEFENDED" | "ABANDONED" | "EXTENSION" | "SUSPENDED"
) {
  return validationRepository.updateStatus(supervisionId, status);
}

/** Validate or reject a supervision (data validation workflow); creates ValidationLog */
export async function validateSupervision(
  supervisionId: string,
  validatorId: string,
  data: {
    validationStatus: "VALIDATED" | "REJECTED";
    validationNotes?: string | null;
    comments?: string | null;
    fieldsChecked?: object | null;
    issues?: object | null;
  }
) {
  return validationRepository.updateValidationStatus(supervisionId, {
    ...data,
    validatorId,
  });
}

export const validationService = {
  getPendingSupervisions,
  updateSupervisionStatus,
  validateSupervision,
};
