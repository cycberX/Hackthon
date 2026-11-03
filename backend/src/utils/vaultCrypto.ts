import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Derives a consistent 32-byte key from the master secret using SHA-256.
 */
function getMasterKey(): Buffer {
  return crypto.createHash('sha256').update(env.VAULT_MASTER_KEY).digest();
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  combined: string; // iv:tag:ciphertext
}

/**
 * Encrypts plaintext API keys using AES-256-GCM authenticated encryption.
 */
export function encryptSecret(plaintext: string): EncryptedPayload {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const ivHex = iv.toString('hex');
  const tagHex = tag.toString('hex');
  const ciphertextHex = encrypted.toString('hex');

  return {
    iv: ivHex,
    tag: tagHex,
    ciphertext: ciphertextHex,
    combined: `${ivHex}:${tagHex}:${ciphertextHex}`,
  };
}

/**
 * Decrypts AES-256-GCM encrypted API keys.
 * Accepts either the combined string ("iv:tag:ciphertext") or individual parts.
 */
export function decryptSecret(encryptedCombined: string): string {
  const parts = encryptedCombined.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format. Expected iv:tag:ciphertext');
  }

  const [ivHex, tagHex, ciphertextHex] = parts;
  const key = getMasterKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Safely masks an API key for dashboard preview display (e.g. "sk_live_1234...9999").
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****' + key.slice(-2);
  const prefixLength = Math.min(8, Math.max(4, Math.floor(key.length / 3)));
  const suffixLength = Math.min(4, Math.max(2, Math.floor(key.length / 6)));
  return `${key.slice(0, prefixLength)}...${key.slice(-suffixLength)}`;
}
