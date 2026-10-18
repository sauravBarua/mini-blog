import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '../src/errors/app-error.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { httpLogger } from '../src/middleware/http-logger.js';

// A tiny app that throws on purpose, so the handler is tested without mocks.
const app = express();
app.use(httpLogger);
app.get('/unhandled', () => {
  throw new Error('database password is hunter2');
});
app.get('/app-error', () => {
  throw new AppError(418, 'I am a teapot', 'TEAPOT', { hint: 'tea' });
});
app.get('/zod', () => {
  z.object({ name: z.string() }).parse({});
});
app.use(errorHandler);

describe('errorHandler', () => {
  it('hides the details of unexpected errors', async () => {
    const res = await request(app).get('/unhandled');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });

  it('maps AppError to its status, code and details', async () => {
    const res = await request(app).get('/app-error');

    expect(res.status).toBe(418);
    expect(res.body.error).toEqual({
      code: 'TEAPOT',
      message: 'I am a teapot',
      details: { hint: 'tea' },
    });
  });

  it('maps ZodError to a 400 with per-field details', async () => {
    const res = await request(app).get('/zod');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toBe('name');
  });
});
