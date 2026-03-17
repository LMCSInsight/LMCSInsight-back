import type { Response, NextFunction } from "express";
import type { UserRole } from "@prisma/client";
import type { AuthRequest } from "./authMiddleware.js";
import { errorRes } from "../utils/response.js";

export function roleMiddleware(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorRes(res, "Unauthorized", 401);
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      errorRes(res, "Forbidden: insufficient permissions", 403);
      return;
    }
    next();
  };
}
