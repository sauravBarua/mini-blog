import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { expect } from 'vitest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { assertTestDatabase } from './test-env.js';

export type Agent = ReturnType<typeof request.agent>;

export const PASSWORD = 'Password123!';

export const randomId = (): string => randomUUID();

export async function resetDb(): Promise<void> {
  assertTestDatabase(env.DATABASE_URL);
  await prisma.$executeRaw`TRUNCATE TABLE "comments", "posts", "users" RESTART IDENTITY CASCADE`;
}

// A client with no cookies.
export function anonymous() {
  return request(app);
}

// Registers a user and returns a client that stays logged in as that user.
export async function signUp(name: string) {
  const agent = request.agent(app);
  const res = await agent.post('/auth/register').send({
    email: `${name.toLowerCase()}@example.com`,
    name,
    password: PASSWORD,
  });
  expect(res.status).toBe(201);
  return { agent, user: res.body.user as { id: string; email: string; name: string } };
}

export async function createPost(
  agent: Agent,
  data: { title?: string; content?: string; published?: boolean } = {},
) {
  const res = await agent
    .post('/posts')
    .send({ title: 'A title', content: 'Some content', published: true, ...data });
  expect(res.status).toBe(201);
  return res.body.post as { id: string; title: string; published: boolean };
}

export function setCookies(res: { headers: Record<string, unknown> }): string[] {
  return (res.headers['set-cookie'] as string[] | undefined) ?? [];
}
