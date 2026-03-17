import { Router } from "express";
import { supervisionService } from "../services/supervisionService.js";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.js";
import { validationMiddleware } from "../middleware/validationMiddleware.js";
import {
  createSupervisionSchema,
  updateSupervisionSchema,
  searchSupervisionSchema,
} from "../validators/supervisionValidator.js";
import { successRes, errorRes } from "../utils/response.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query as { page?: string; pageSize?: string };
    const data = await supervisionService.getSupervisions(
      Number(page),
      Number(pageSize),
      req.user?.userId,
      req.user?.role,
      req.user?.chercheur_id
    );
    successRes(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch supervisions";
    errorRes(res, message, 400);
  }
});

router.get(
  "/search",
  validationMiddleware({ query: searchSupervisionSchema.shape.query }),
  async (req: AuthRequest, res) => {
    try {
      const query = req.query as Record<string, string | undefined>;
      const filters = {
        chercheurId: query.chercheurId,
        themeId: query.themeId,
        type: query.type as "PFE" | "MASTER" | "PHD" | "INTERNSHIP" | "PROJECT" | undefined,
        academicYear: query.academicYear,
        status: query.status as "IN_PROGRESS" | "DEFENDED" | "ABANDONED" | "EXTENSION" | "SUSPENDED" | undefined,
        validationStatus: query.validationStatus as "PENDING" | "VALIDATED" | "REJECTED" | "REVISED" | undefined,
        keywords: query.keywords,
        page: query.page ? Number(query.page) : undefined,
        pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      };
      const data = await supervisionService.searchSupervisions(filters);
      successRes(res, data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      errorRes(res, message, 400);
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await supervisionService.getSupervisionById(id);
    successRes(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not found";
    errorRes(res, message, 404);
  }
});

router.post(
  "/",
  validationMiddleware({ body: createSupervisionSchema.shape.body }),
  async (req: AuthRequest, res) => {
    try {
      const data = await supervisionService.createSupervision(req.body);
      successRes(res, data, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      errorRes(res, message, 400);
    }
  }
);

router.put(
  "/:id",
  validationMiddleware({ params: updateSupervisionSchema.shape.params, body: updateSupervisionSchema.shape.body }),
  async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await supervisionService.updateSupervision(id, req.body);
      successRes(res, data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      errorRes(res, message, err instanceof Error && message === "Supervision not found" ? 404 : 400);
    }
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await supervisionService.deleteSupervision(id);
    successRes(res, { deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    errorRes(res, message, 404);
  }
});

router.post("/:id/supervisors", async (req, res) => {
  try {
    const { supervisorId, contributionPercent, isMainSupervisor, isExternal } = req.body as {
      supervisorId: string;
      contributionPercent?: number;
      isMainSupervisor?: boolean;
      isExternal?: boolean;
    };
    if (!supervisorId) {
      errorRes(res, "supervisorId (chercheur_id) is required", 400);
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await supervisionService.addCoSupervisor(id, supervisorId, {
      contributionPercent,
      isMainSupervisor,
      isExternal,
    });
    successRes(res, data, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Add supervisor failed";
    errorRes(res, message, 400);
  }
});

export default router;
