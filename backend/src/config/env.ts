import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const port = parseInt(process.env.PORT || '5000', 10);
const baseUrl = process.env.BASE_URL || process.env.API_BASE_URL?.replace(/\/api\/v1\/?$/, '') || `http://localhost:${port}`;

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: port,
  BASE_URL: baseUrl,
  API_BASE_URL: process.env.API_BASE_URL || `${baseUrl}/api/v1`,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hack_vsak',
  JWT_SECRET: process.env.JWT_SECRET || '58d3cfefba0798c8d9f3d554eb3be5d91366d408c504e6fb9114954dc89cae1e9ce37e132eba3f052830bac2b7a19a94',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '0b2ca91c25e7a2e9ab6d8ead99eaf5a455c5c8d8313f5f8322ab24e5554e1eb57686d1561d17d47af4c7e1ffb4403b92',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // Allow any IP/origin for development/testing as requested
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  // Vault AES-256-GCM Master Encryption Key
  VAULT_MASTER_KEY: process.env.VAULT_MASTER_KEY || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  EMAIL: {
    FROM: process.env.EMAIL_FROM || 'OneAPI Security <no-reply@oneapi.dev>',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  },
} as const;
