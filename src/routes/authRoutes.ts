import { Router } from "express";
import { authService } from "../services/authService.js";
import { validationMiddleware } from "../middleware/validationMiddleware.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";
import { successRes, errorRes } from "../utils/response.js";

const router = Router();

router.post(
  "/register",
  validationMiddleware({ body: registerSchema.shape.body }),
  async (req, res) => {
    try {
      const data = await authService.register(req.body);
      successRes(res, data, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      errorRes(res, message, 400);
    }
  }
);

router.post(
  "/login",
  validationMiddleware({ body: loginSchema.shape.body }),
  async (req, res) => {
    try {
      const data = await authService.login(req.body);
      successRes(res, data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      errorRes(res, message, 401);
    }
  }
);

router.post("/logout", (_req, res) => {
  res.status(204).end();
});

export default router;
