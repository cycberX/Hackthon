import { renderBaseEmailLayout } from './baseLayout.js';

export interface SignupOtpTemplateParams {
  name: string;
  email: string;
  otp: string;
  expiresInMinutes?: number;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generates the email template for Account Signup OTP Verification.
 */
export function getSignupOtpTemplate({
  name,
  email,
  otp,
  expiresInMinutes = 10,
}: SignupOtpTemplateParams): EmailContent {
  const subject = `Your Verification Code: ${otp} - OneAPI`;

  const bodyContent = `
    <div class="greeting">Hello ${name || 'there'},</div>
    <p>Thank you for signing up for <strong>OneAPI</strong>. To verify your email address (<code>${email}</code>) and activate your account, please use the one-time verification code below:</p>
    
    <div class="otp-card">
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">This code is valid for ${expiresInMinutes} minutes</div>
    </div>

    <div class="alert-box">
      <strong>Security Notice:</strong> Never share this code with anyone. OneAPI support agents will never ask for your verification code.
    </div>

    <p style="color: #64748b; font-size: 14px;">If you did not attempt to create an account with this email address, you can safely ignore this email.</p>
  `;

  const html = renderBaseEmailLayout({
    title: 'Verify Your Email Address',
    previewText: `Your verification code is ${otp}. Valid for ${expiresInMinutes} minutes.`,
    bodyContent,
  });

  const text = `Hello ${name || 'there'},

Thank you for signing up for OneAPI.

Your one-time verification code is: ${otp}
This code will expire in ${expiresInMinutes} minutes.

Security Notice: Never share this code with anyone. OneAPI staff will never ask for your code.
If you did not request this verification, please disregard this email.
`;

  return { subject, html, text };
}
