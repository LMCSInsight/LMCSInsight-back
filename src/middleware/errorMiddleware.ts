import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    res.status(400).json({ success: false, error: message });
    return;
  }
  if (err && typeof err === "object" && "code" in err) {
    const prismaErr = err as { code?: string; meta?: unknown };
    if (prismaErr.code === "P2002") {
      res.status(409).json({ success: false, error: "Resource already exists (unique constraint)" });
      return;
    }
    if (prismaErr.code === "P2025") {
      res.status(404).json({ success: false, error: "Record not found" });
      return;
    }
  }
  logger.error("Unhandled error", { err: err instanceof Error ? err.message : String(err) });
  const message = env.NODE_ENV === "production" ? "Internal server error" : (err as Error)?.message ?? "Unknown error";
  res.status(500).json({ success: false, error: message });
}
