import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { TokenPayload } from "../types/authTypes.js";

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
