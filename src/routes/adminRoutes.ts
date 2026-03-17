import { Router } from "express";
import * as adminService from "../services/adminService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { successRes, errorRes } from "../utils/response.js";
import { ROLES } from "../constants/roles.js";
import { z } from "zod";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN));

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "DIRECTOR", "TEACHER", "ASSISTANT"]),
  phoneNumber: z.string().optional().nullable(),
  chercheur_id: z.string().optional().nullable(),
});

router.get("/users", async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query as { page?: string; pageSize?: string };
    const data = await adminService.getUsers(Number(page), Number(pageSize));
    successRes(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch users";
    errorRes(res, message, 500);
  }
});

router.post("/users", async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      errorRes(res, parsed.error.message, 400);
      return;
    }
    const data = await adminService.createUser(parsed.data);
    successRes(res, data, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create user failed";
    errorRes(res, message, 400);
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await adminService.updateUser(id, req.body);
    successRes(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    errorRes(res, message, 400);
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await adminService.deleteUser(id);
    successRes(res, { deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    errorRes(res, message, 404);
  }
});

export default router;
