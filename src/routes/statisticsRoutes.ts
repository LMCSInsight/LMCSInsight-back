import { Router } from "express";
import * as statisticsService from "../services/statisticsService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { successRes, errorRes } from "../utils/response.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/overview",
  roleMiddleware(ROLES.DIRECTOR, ROLES.ADMIN),
  async (_req, res) => {
    try {
      const [total, byType, loadPerTeacher, defenseRate, avgDuration] = await Promise.all([
        statisticsService.getTotalSupervisions(),
        statisticsService.getDistributionByType(),
        statisticsService.getSupervisionLoadPerTeacher(),
        statisticsService.getDefenseRate(),
        statisticsService.getAverageSupervisionDuration(),
      ]);
      successRes(res, {
        totalSupervisions: total,
        distributionByType: byType,
        supervisionLoadPerTeacher: loadPerTeacher,
        defenseRate,
        averageSupervisionDuration: avgDuration,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch statistics";
      errorRes(res, message, 500);
    }
  }
);

export default router;
