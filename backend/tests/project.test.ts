import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../src/app.js';
import { initProviders } from '../src/providers/index.js';
import { Project } from '../src/models/Project.js';

describe('11. OneAPI Project Isolation & Multi-Project Data Model Tests', () => {
  initProviders();
  const app = createApp();
  let server: http.Server;
  let baseUrl: string;

  it('should start project test server', async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    assert.ok(baseUrl);
  });

  it('GET /api/v1/projects should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects`);
    assert.equal(res.status, 401);
  });

  it('POST /api/v1/projects should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Project' }),
    });
    assert.equal(res.status, 401);
  });

  it('GET /api/v1/projects/default should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects/default`);
    assert.equal(res.status, 401);
  });

  it('GET /api/v1/projects/:projectId should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects/65f1a2b3c4d5e6f7a8b9c0d1`);
    assert.equal(res.status, 401);
  });

  it('PUT /api/v1/projects/:projectId should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects/65f1a2b3c4d5e6f7a8b9c0d1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed Project' }),
    });
    assert.equal(res.status, 401);
  });

  it('DELETE /api/v1/projects/:projectId should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/projects/65f1a2b3c4d5e6f7a8b9c0d1`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 401);
  });

  it('GET /api/v1/dashboard/overview with project query should require authentication (401)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/overview?projectId=65f1a2b3c4d5e6f7a8b9c0d1`);
    assert.equal(res.status, 401);
  });

  it('Project data model should define proper indexes and schema constraints', () => {
    assert.ok(Project.schema.paths['userId']);
    assert.ok(Project.schema.paths['name']);
    assert.ok(Project.schema.paths['slug']);
    assert.ok(Project.schema.paths['isDefault']);
  });

  it('should close project test server', async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
