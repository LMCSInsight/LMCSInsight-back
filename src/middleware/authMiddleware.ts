import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import type { TokenPayload } from "../types/authTypes.js";
import { errorRes } from "../utils/response.js";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    errorRes(res, "Unauthorized: missing or invalid token", 401);
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    errorRes(res, "Unauthorized: invalid or expired token", 401);
  }
}
