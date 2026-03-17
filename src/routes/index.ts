import { Router } from "express";
import authRoutes from "./authRoutes.js";
import supervisionRoutes from "./supervisionRoutes.js";
import studentRoutes from "./studentRoutes.js";
import validationRoutes from "./validationRoutes.js";
import statisticsRoutes from "./statisticsRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/supervisions", supervisionRoutes);
router.use("/students", studentRoutes);
router.use("/validation", validationRoutes);
router.use("/statistics", statisticsRoutes);
router.use("/admin", adminRoutes);

export default router;
