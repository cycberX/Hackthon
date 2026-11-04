import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../src/app.js';
import { initProviders } from '../src/providers/index.js';
import { generateAccessToken } from '../src/utils/tokens.js';

describe('7. OneAPI Developer Gateway, Vault & Dashboard Integration Tests', () => {
  initProviders();
  const app = createApp();
  let server: http.Server;
  let baseUrl: string;

  // Mock valid user auth token
  const dummyUserToken = generateAccessToken({
    userId: '65f1a2b3c4d5e6f7a8b9c0d1',
    email: 'developer@oneapi.dev',
    role: 'user',
  });

  it('should start test server', async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    assert.ok(baseUrl);
  });

  it('GET /api/v1/vault should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/vault`);
    assert.equal(res.status, 401);
  });

  it('GET /api/v1/routing should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/routing`);
    assert.equal(res.status, 401);
  });

  it('GET /api/v1/dashboard/overview should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/overview`);
    assert.equal(res.status, 401);
  });

  it('GET /api/v1/providers should return 11 default registered providers across 5 categories', async () => {
    const res = await fetch(`${baseUrl}/api/v1/providers`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.success, true);
    assert.equal(body.data.totalRegistered, 11);
    assert.equal(body.data.categories.length, 5);

    const ai = body.data.categories.find((c: any) => c.category === 'ai');
    assert.ok(ai);
    assert.equal(ai.registeredProviders.length, 3); // Gemini, Groq, OpenRouter
  });

  it('POST /api/v1/proxy/ai/upload should reject without token (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/proxy/ai/upload`, {
      method: 'POST',
      body: JSON.stringify({ filename: 'test.pdf', purpose: 'assistants' }),
    });
    assert.equal(res.status, 401);
    const data = (await res.json()) as any;
    assert.equal(data.error.code, 'UNAUTHORIZED');
  });

  it('should close gateway test server', async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
