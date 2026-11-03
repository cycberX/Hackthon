/**
 * Email Templates Module
 *
 * This directory exclusively contains email templates:
 * - signupOtp: Verification code sent upon user registration
 * - tryToLogin: Security alert sent when a sign-in attempt occurs
 * - apiKeyCreated: Notification with masked preview when a new API key is generated
 * - forgotPassword: Password recovery code sent for password resets
 * - passwordResetSuccess: Security confirmation that password was updated
 * - emailVerifiedWelcome: Welcome message sent after successful verification
 */

export * from './baseLayout.js';
export * from './signupOtp.template.js';
export * from './tryToLogin.template.js';
export * from './apiKeyCreated.template.js';
export * from './forgotPassword.template.js';
export * from './passwordResetSuccess.template.js';
export * from './emailVerifiedWelcome.template.js';
