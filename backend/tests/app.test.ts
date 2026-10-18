import { describe, expect, it } from 'vitest';
import { anonymous } from './helpers.js';

describe('health checks', () => {
  it('GET /health returns ok', async () => {
    const res = await anonymous().get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /health/db reaches the database', async () => {
    const res = await anonymous().get('/health/db');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });
});

describe('error handling', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await anonymous().get('/nope');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await anonymous()
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "email": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('GET /docs.json', () => {
  it('serves the OpenAPI document', async () => {
    const res = await anonymous().get('/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(Object.keys(res.body.paths)).toContain('/posts/{id}');
  });
});
