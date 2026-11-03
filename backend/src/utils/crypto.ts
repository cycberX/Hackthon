import crypto from 'crypto';

/**
 * Generates a cryptographically secure numeric OTP string (default: 6 digits) with zero modulo bias.
 */
export function generateNumericOtp(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, 10)];
  }
  return otp;
}

/**
 * Constant-time string comparison to prevent timing attacks on sensitive token hashes.
 */
export function safeCompare(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Computes a SHA-256 hash of a string (used to safely store OTPs, reset tokens, and API key hashes).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a cryptographically random hexadecimal token.
 */
export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export interface GeneratedApiKey {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
}

/**
 * Generates a full API key, masked preview prefix, and its storage hash.
 * Format: sk_live_<64 hex chars>
 */
export function generateApiKey(prefix: string = 'sk_live_'): GeneratedApiKey {
  const randomPart = crypto.randomBytes(24).toString('hex');
  const rawKey = `${prefix}${randomPart}`;
  const keyPrefix = `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`;
  const keyHash = hashToken(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}
