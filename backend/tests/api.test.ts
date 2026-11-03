import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../src/app.js';

describe('4. Express API, CORS & API Key Validation Integration Tests', () => {
  const app = createApp();
  let server: http.Server;
  let baseUrl: string;

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

  it('GET / should return operational status', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.status, 'operational');
    assert.equal(data.name, 'HackVsak Backend API');
  });

  it('CORS should permit requests from any IP/Origin', async () => {
    const testOrigins = ['http://192.168.1.50:3000', 'http://10.0.0.5:8080', 'http://random-client.com'];
    for (const origin of testOrigins) {
      const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'POST',
        },
      });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get('access-control-allow-origin'), origin);
      assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    }
  });

  it('GET /api/v1/auth/login should return 200 with interactive route guide when visited in browser', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.success, true);
    assert.equal(data.endpoint, '/api/v1/auth/login');
    assert.equal(data.method, 'POST');
    assert.ok(data.exampleBody);
  });

  it('GET /api/v1/auth should return 200 with complete catalog of auth routes', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.ok(Array.isArray(data.routes));
    assert.ok(data.routes.length >= 10);
  });

  it('GET /api/v1/proxy/ai/chat should return 200 with route guide when visited in browser', async () => {
    const res = await fetch(`${baseUrl}/api/v1/proxy/ai/chat`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.success, true);
    assert.equal(data.endpoint, '/api/v1/proxy/ai/chat');
    assert.equal(data.method, 'POST');
  });

  it('POST /api/v1/auth/signup should reject if phone_no or terms_accepted are missing', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json() as any;
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'VALIDATION_ERROR');
    const fields = data.error.details.map((d: any) => d.field);
    assert.ok(fields.includes('phone_no') || fields.includes('terms_accepted'));
  });

  it('POST /api/v1/auth/signup should reject if terms_accepted is false', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        phone_no: '+1234567890',
        password: 'Password123!',
        terms_accepted: false,
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json() as any;
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login should reject missing password with 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json() as any;
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/create-api-key should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/create-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Key' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json() as any;
    assert.equal(data.error.code, 'UNAUTHORIZED');
  });

  it('POST /api/v1/auth/api-keys/validate should reject missing userId or email with 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/api-keys/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'sk_live_12345' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json() as any;
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'VALIDATION_ERROR');
  });

  it('GET /api/v1/auth/me should return 401 UNAUTHORIZED when no token is passed', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(res.status, 401);
    const data = await res.json() as any;
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me should return 401 INVALID_TOKEN when an invalid token is passed', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: 'Bearer this_is_a_completely_fake_token' },
    });
    assert.equal(res.status, 401);
    const data = await res.json() as any;
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'INVALID_TOKEN');
  });

  it('GET /api/v1/proxy/providers should list all categories and demo providers', async () => {
    const res = await fetch(`${baseUrl}/api/v1/proxy/providers`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data.categories));
    assert.equal(data.data.categories.length, 5);
  });

  it('POST /api/v1/proxy/ai/chat should reject requests without project token (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/proxy/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });
    assert.equal(res.status, 401);
    const data = await res.json() as any;
    assert.equal(data.error.code, 'MISSING_PROJECT_TOKEN');
  });

  it('GET /health returns health info', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.ok(res.status === 200 || res.status === 503);
    const data = await res.json() as any;
    assert.ok(data.database);
    assert.ok(data.status);
  });

  it('should close test server', async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
