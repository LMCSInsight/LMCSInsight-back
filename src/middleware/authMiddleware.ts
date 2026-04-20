import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, type TokenPayload } from '../utils/tokenUtils.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED' })
    return
  }

  const token = authHeader.slice(7)
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED' })
  }
}
