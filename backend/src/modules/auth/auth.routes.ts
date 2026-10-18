import { Router } from 'express';
import { AppError } from '../../errors/app-error.js';
import { signToken } from '../../lib/jwt.js';
import { authenticate, getAuthUserId } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rate-limit.js';
import { clearAuthCookie, setAuthCookie } from './auth.cookie.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { getUserById, loginUser, registerUser } from './auth.service.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);
  setAuthCookie(res, await signToken(user.id));
  res.status(201).json({ user });
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await loginUser(input);
  setAuthCookie(res, await signToken(user.id));
  res.status(200).json({ user });
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

authRouter.get('/me', authenticate, async (_req, res) => {
  const user = await getUserById(getAuthUserId(res));
  if (!user) {
    throw new AppError(401, 'Account no longer exists', 'UNAUTHENTICATED');
  }
  res.status(200).json({ user });
});
