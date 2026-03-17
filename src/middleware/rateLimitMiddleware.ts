import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 100 : 1000,
  message: { success: false, error: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});
