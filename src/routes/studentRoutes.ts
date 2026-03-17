import { Router } from "express";
import { studentService } from "../services/studentService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validationMiddleware } from "../middleware/validationMiddleware.js";
import { createStudentSchema, updateStudentSchema } from "../validators/studentValidator.js";
import { successRes, errorRes } from "../utils/response.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search } = req.query as { page?: string; pageSize?: string; search?: string };
    const data = await studentService.getStudents(Number(page), Number(pageSize), search);
    successRes(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch students";
    errorRes(res, message, 400);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await studentService.getStudentById(id);
    successRes(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not found";
    errorRes(res, message, 404);
  }
});

router.post(
  "/",
  validationMiddleware({ body: createStudentSchema.shape.body }),
  async (req, res) => {
    try {
      const data = await studentService.createStudent(req.body);
      successRes(res, data, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      errorRes(res, message, 400);
    }
  }
);

router.put(
  "/:id",
  validationMiddleware({ params: updateStudentSchema.shape.params, body: updateStudentSchema.shape.body }),
  async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await studentService.updateStudent(id, req.body);
      successRes(res, data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      errorRes(res, message, err instanceof Error && message === "Student not found" ? 404 : 400);
    }
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await studentService.deleteStudent(id);
    successRes(res, { deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    errorRes(res, message, 404);
  }
});

export default router;
