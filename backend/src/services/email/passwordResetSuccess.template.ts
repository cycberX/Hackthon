import { renderBaseEmailLayout } from './baseLayout.js';
import type { EmailContent } from './signupOtp.template.js';

export interface PasswordResetSuccessParams {
  name: string;
  email: string;
  timestamp?: string;
}

/**
 * Generates the email template confirming that password has been changed.
 */
export function getPasswordResetSuccessTemplate({
  name,
  email,
  timestamp = new Date().toUTCString(),
}: PasswordResetSuccessParams): EmailContent {
  const subject = `Security Notice: Your OneAPI Password Has Been Changed`;

  const bodyContent = `
    <div class="greeting">Hello ${name || 'User'},</div>
    <p>This is confirmation that the password for your OneAPI account (<strong>${email}</strong>) was successfully updated on <strong>${timestamp}</strong>.</p>
    
    <div class="alert-box">
      <strong>Didn't make this change?</strong><br>
      If you did not perform this action, please contact our security team immediately to regain control of your account.
    </div>

    <p style="color: #64748b; font-size: 13px;">If you made this change, you can safely disregard this message.</p>
  `;

  const html = renderBaseEmailLayout({
    title: 'Password Changed Successfully',
    previewText: `Your OneAPI password was changed on ${timestamp}.`,
    bodyContent,
  });

  const text = `Hello ${name || 'User'},

Your OneAPI password for ${email} was successfully changed on ${timestamp}.

If you did not initiate this change, please contact support immediately.
`;

  return { subject, html, text };
}
