import type { Response } from "express";

export function successRes<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data });
}

export function errorRes(res: Response, message: string, statusCode = 500): Response {
  return res.status(statusCode).json({ success: false, error: message });
}
