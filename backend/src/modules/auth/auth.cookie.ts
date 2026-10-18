import type { Response } from 'express';
import { env } from '../../config/env.js';

export const AUTH_COOKIE = 'token';

const baseOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} as const;

const maxAgeMs = env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, { ...baseOptions, maxAge: maxAgeMs });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, baseOptions);
}
