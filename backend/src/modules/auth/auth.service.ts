import bcrypt from 'bcryptjs';
import { AppError } from '../../errors/app-error.js';
import { prisma } from '../../lib/prisma.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown, so login takes the same time either way.
const dummyHash = await bcrypt.hash('not-a-real-password', BCRYPT_ROUNDS);

const publicUserSelect = { id: true, email: true, name: true, createdAt: true } as const;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    return await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
      select: publicUserSelect,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, 'Email already in use', 'EMAIL_TAKEN');
    }
    throw err;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? dummyHash);

  if (!user || !passwordMatches) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}
