import { renderBaseEmailLayout } from './baseLayout.js';
import type { EmailContent } from './signupOtp.template.js';

export interface ForgotPasswordTemplateParams {
  name: string;
  email: string;
  otp: string;
  expiresInMinutes?: number;
}

/**
 * Generates the email template for Password Reset OTP / Request.
 */
export function getForgotPasswordTemplate({
  name,
  email,
  otp,
  expiresInMinutes = 15,
}: ForgotPasswordTemplateParams): EmailContent {
  const subject = `Reset Your Password: Code ${otp} - OneAPI`;

  const bodyContent = `
    <div class="greeting">Hello ${name || 'User'},</div>
    <p>We received a request to reset the password for your OneAPI account associated with <strong>${email}</strong>.</p>
    
    <p>Use the following password reset code to set a new password:</p>

    <div class="otp-card">
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">This code will expire in ${expiresInMinutes} minutes</div>
    </div>

    <div class="alert-box">
      <strong>Important:</strong> If you did not request a password reset, please ignore this email. Your existing password will remain completely safe and unchanged.
    </div>
  `;

  const html = renderBaseEmailLayout({
    title: 'Password Reset Request',
    previewText: `Your password reset code is ${otp}. Valid for ${expiresInMinutes} minutes.`,
    bodyContent,
  });

  const text = `Hello ${name || 'User'},

We received a request to reset your password for OneAPI (${email}).

Your password reset code is: ${otp}
This code will expire in ${expiresInMinutes} minutes.

If you did not request this change, you can safely ignore this email. Your password will remain unchanged.
`;

  return { subject, html, text };
}
