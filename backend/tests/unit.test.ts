import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateNumericOtp, hashToken, generateApiKey } from '../src/utils/crypto.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/utils/tokens.js';
import {
  getSignupOtpTemplate,
  getTryToLoginTemplate,
  getApiKeyCreatedTemplate,
  getForgotPasswordTemplate,
  getPasswordResetSuccessTemplate,
  getEmailVerifiedWelcomeTemplate,
} from '../src/services/email/index.js';

describe('1. Crypto Utilities', () => {
  it('should generate a 6-digit numeric OTP', () => {
    const otp = generateNumericOtp(6);
    assert.equal(otp.length, 6);
    assert.match(otp, /^\d{6}$/);
  });

  it('should hash tokens deterministically using SHA-256', () => {
    const raw = '123456';
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });

  it('should generate a valid API key with preview prefix and hash', () => {
    const { rawKey, keyPrefix, keyHash } = generateApiKey();
    assert.ok(rawKey.startsWith('sk_live_'));
    assert.ok(keyPrefix.includes('...'));
    assert.equal(keyHash.length, 64);
    assert.equal(keyHash, hashToken(rawKey));
  });
});

describe('2. JWT Token Utilities', () => {
  const payload = {
    userId: '60d0fe4f5311236168a109ca',
    email: 'developer@example.com',
    role: 'user',
  };

  it('should generate and verify an access token', () => {
    const token = generateAccessToken(payload);
    assert.ok(token);
    const decoded = verifyAccessToken(token);
    assert.equal(decoded.userId, payload.userId);
    assert.equal(decoded.email, payload.email);
    assert.equal(decoded.role, payload.role);
  });

  it('should generate and verify a refresh token', () => {
    const token = generateRefreshToken(payload);
    assert.ok(token);
    const decoded = verifyRefreshToken(token);
    assert.equal(decoded.userId, payload.userId);
    assert.equal(decoded.email, payload.email);
  });
});

describe('3. Email Service Templates', () => {
  it('should render Signup OTP template with code and security advisory', () => {
    const template = getSignupOtpTemplate({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      otp: '482910',
      expiresInMinutes: 10,
    });
    assert.ok(template.subject.includes('482910'));
    assert.ok(template.html.includes('482910'));
    assert.ok(template.html.includes('Alex Rivera'));
    assert.ok(template.text.includes('482910'));
  });

  it('should render Try To Login template with IP and device metadata', () => {
    const template = getTryToLoginTemplate({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: 'Tue, 03 Nov 2026 12:00:00 GMT',
      location: 'New York, USA',
    });
    assert.ok(template.subject.includes('Security Alert: New Sign-In'));
    assert.ok(template.html.includes('192.168.1.100'));
    assert.ok(template.html.includes('Mozilla/5.0'));
    assert.ok(template.text.includes('192.168.1.100'));
  });

  it('should render API Key Created template with key identifier and best practices', () => {
    const template = getApiKeyCreatedTemplate({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      keyName: 'Production Payment Webhook Key',
      keyPrefix: 'sk_live_1234...9999',
      ipAddress: '10.0.0.1',
    });
    assert.ok(template.subject.includes('Production Payment Webhook Key'));
    assert.ok(template.html.includes('sk_live_1234...9999'));
    assert.ok(template.html.includes('Security Best Practices'));
    assert.ok(template.text.includes('sk_live_1234...9999'));
  });

  it('should render Forgot Password template with OTP code', () => {
    const template = getForgotPasswordTemplate({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      otp: '772194',
      expiresInMinutes: 15,
    });
    assert.ok(template.subject.includes('772194'));
    assert.ok(template.html.includes('772194'));
    assert.ok(template.text.includes('772194'));
  });

  it('should render Password Reset Success template', () => {
    const template = getPasswordResetSuccessTemplate({
      name: 'Alex Rivera',
      email: 'alex@example.com',
    });
    assert.ok(template.subject.includes('Your OneAPI Password Has Been Changed'));
    assert.ok(template.html.includes('Alex Rivera'));
  });

  it('should render Welcome Verified template', () => {
    const template = getEmailVerifiedWelcomeTemplate({
      name: 'Alex Rivera',
      email: 'alex@example.com',
    });
    assert.ok(template.subject.includes('Welcome to OneAPI'));
    assert.ok(template.html.includes('Alex Rivera'));
  });
});
