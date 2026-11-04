/**
 * Centralized Base URL & API Configuration for OneAPI Frontend
 */

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'http://localhost:5000';

export const APP_BASE_URL: string =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const getApiUrl = (endpoint: string = ''): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL.replace(/\/+$/, '')}${cleanEndpoint}`;
};

export const getAppUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_BASE_URL.replace(/\/+$/, '')}${cleanPath}`;
};

export default {
  API_BASE_URL,
  APP_BASE_URL,
  getApiUrl,
  getAppUrl,
};
