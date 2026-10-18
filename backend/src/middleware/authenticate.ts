import type { RequestHandler, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { verifyToken } from '../lib/jwt.js';
import { AUTH_COOKIE } from '../modules/auth/auth.cookie.js';

export const authenticate: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[AUTH_COOKIE];

  if (typeof token !== 'string') {
    next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED'));
    return;
  }

  try {
    res.locals.userId = await verifyToken(token);
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired session', 'UNAUTHENTICATED'));
  }
};

export function getAuthUserId(res: Response): string {
  return res.locals.userId as string;
}
