import { renderBaseEmailLayout } from './baseLayout.js';
import type { EmailContent } from './signupOtp.template.js';

export interface EmailVerifiedWelcomeParams {
  name: string;
  email: string;
}

/**
 * Generates the email template welcoming user upon successful email verification.
 */
export function getEmailVerifiedWelcomeTemplate({
  name,
  email,
}: EmailVerifiedWelcomeParams): EmailContent {
  const subject = `Welcome to OneAPI! Your Email is Verified 🎉`;

  const bodyContent = `
    <div class="greeting">Welcome aboard, ${name || 'there'}!</div>
    <p>Your email address (<strong>${email}</strong>) has been successfully verified. Your account is now fully active.</p>
    
    <p>Here are a few things you can do right now:</p>
    <ul>
      <li>Log in securely using your registered email and password.</li>
      <li>Generate API keys to interact with OneAPI programmatically.</li>
      <li>Access our protected endpoints and services.</li>
    </ul>

    <div style="text-align: center; margin: 28px 0;">
      <a href="#" class="btn">Go to Dashboard</a>
    </div>

    <p style="color: #64748b; font-size: 13px;">If you have any questions or need assistance, our developer documentation and support team are always here to help.</p>
  `;

  const html = renderBaseEmailLayout({
    title: 'Welcome to OneAPI',
    previewText: `Your OneAPI email verification is complete! Welcome aboard.`,
    bodyContent,
  });

  const text = `Welcome to OneAPI, ${name || 'there'}!

Your email (${email}) has been verified and your account is now fully active.

You can now log in, generate API keys, and explore all OneAPI services.

Welcome aboard!
`;

  return { subject, html, text };
}
