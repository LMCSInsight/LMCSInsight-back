import { Router } from "express";
import { validationService } from "../services/validationService.js";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { successRes, errorRes } from "../utils/response.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.use(authMiddleware);

router.get("/pending", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query as { page?: string; pageSize?: string };
    const data = await validationService.getPendingSupervisions(Number(page), Number(pageSize));
    successRes(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch pending";
    errorRes(res, message, 400);
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body as { status: "DEFENDED" | "ABANDONED" | "EXTENSION" | "SUSPENDED" };
    if (!status || !["DEFENDED", "ABANDONED", "EXTENSION", "SUSPENDED"].includes(status)) {
      errorRes(res, "Invalid status", 400);
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await validationService.updateSupervisionStatus(id, status);
    successRes(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    errorRes(res, message, 400);
  }
});

router.patch(
  "/:id/validate",
  roleMiddleware(ROLES.ASSISTANT, ROLES.ADMIN),
  async (req: AuthRequest, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { validationStatus, validationNotes, comments, fieldsChecked, issues } = req.body as {
        validationStatus: "VALIDATED" | "REJECTED";
        validationNotes?: string | null;
        comments?: string | null;
        fieldsChecked?: object | null;
        issues?: object | null;
      };
      if (!validationStatus || !["VALIDATED", "REJECTED"].includes(validationStatus)) {
        errorRes(res, "validationStatus must be VALIDATED or REJECTED", 400);
        return;
      }
      if (!req.user?.userId) {
        errorRes(res, "Unauthorized", 401);
        return;
      }
      const data = await validationService.validateSupervision(id, req.user.userId, {
        validationStatus,
        validationNotes: validationNotes ?? null,
        comments: comments ?? null,
        fieldsChecked: fieldsChecked ?? null,
        issues: issues ?? null,
      });
      successRes(res, data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation failed";
      errorRes(res, message, 400);
    }
  }
);

export default router;
