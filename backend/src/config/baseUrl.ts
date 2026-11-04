import type { Request } from 'express';
import { env } from './env.js';

/**
 * Returns the backend gateway base URL.
 * Dynamically resolves from incoming Request headers (for Vercel / reverse proxy)
 * or falls back to configured env.BASE_URL.
 */
export function getBaseUrl(req?: Request): string {
  if (req) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
    if (host) {
      return `${proto}://${host}`;
    }
  }
  return env.BASE_URL;
}

/**
 * Returns the full API v1 base URL (e.g. http://localhost:5000/api/v1)
 */
export function getApiBaseUrl(req?: Request): string {
  const base = getBaseUrl(req).replace(/\/+$/, '');
  return `${base}/api/v1`;
}

export default {
  getBaseUrl,
  getApiBaseUrl,
  BASE_URL: env.BASE_URL,
  API_BASE_URL: env.API_BASE_URL,
  FRONTEND_URL: env.FRONTEND_URL,
};
