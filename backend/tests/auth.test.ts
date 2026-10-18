import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma.js';
import { PASSWORD, anonymous, resetDb, setCookies, signUp } from './helpers.js';

beforeEach(resetDb);

const validBody = { email: 'alice@example.com', name: 'Alice', password: PASSWORD };

describe('POST /auth/register', () => {
  it('creates the user and starts a session', async () => {
    const res = await anonymous().post('/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'alice@example.com', name: 'Alice' });
    expect(res.body.user).not.toHaveProperty('passwordHash');

    const cookie = setCookies(res).join(';');
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('stores a bcrypt hash, never the password', async () => {
    await anonymous().post('/auth/register').send(validBody);

    const row = await prisma.user.findUniqueOrThrow({ where: { email: validBody.email } });
    expect(row.passwordHash).not.toContain(PASSWORD);
    expect(row.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('normalizes the email', async () => {
    const res = await anonymous()
      .post('/auth/register')
      .send({ ...validBody, email: '  Mixed@Example.COM ' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('mixed@example.com');
  });

  it('rejects a duplicate email, ignoring case', async () => {
    await signUp('Alice');

    const res = await anonymous()
      .post('/auth/register')
      .send({ ...validBody, email: 'ALICE@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects invalid input with per-field details', async () => {
    const res = await anonymous()
      .post('/auth/register')
      .send({ email: 'not-an-email', name: '', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');

    const paths = res.body.error.details.map((detail: { path: string }) => detail.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'name', 'password']));
  });

  it('rejects passwords longer than bcrypt can use', async () => {
    const res = await anonymous()
      .post('/auth/register')
      .send({ ...validBody, password: 'a'.repeat(73) });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await signUp('Alice');
  });

  it('logs in with correct credentials, ignoring email case', async () => {
    const res = await anonymous()
      .post('/auth/login')
      .send({ email: 'ALICE@Example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@example.com');
    expect(setCookies(res).join(';')).toMatch(/token=/);
  });

  it('rejects a wrong password', async () => {
    const res = await anonymous()
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('gives the same answer for an unknown email', async () => {
    const wrongPassword = await anonymous()
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'WrongPassword1!' });
    const unknownEmail = await anonymous()
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: PASSWORD });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('rejects missing fields', async () => {
    const res = await anonymous().post('/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /auth/me and POST /auth/logout', () => {
  it('requires a session', async () => {
    const res = await anonymous().get('/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a tampered token', async () => {
    const res = await anonymous().get('/auth/me').set('Cookie', 'token=garbage');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns the current user', async () => {
    const { agent, user } = await signUp('Alice');

    const res = await agent.get('/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  it('ends the session on logout', async () => {
    const { agent } = await signUp('Alice');

    const logout = await agent.post('/auth/logout');
    expect(logout.status).toBe(204);

    const res = await agent.get('/auth/me');
    expect(res.status).toBe(401);
  });
});
