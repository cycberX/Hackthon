import { renderBaseEmailLayout } from './baseLayout.js';
import type { EmailContent } from './signupOtp.template.js';

export interface TryToLoginTemplateParams {
  name: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  timestamp?: string;
  location?: string;
}

/**
 * Generates the email template for Login Attempt / New Sign-in Alert.
 * Sent when a user signs in to notify them of device, IP, and time details.
 */
export function getTryToLoginTemplate({
  name,
  email,
  ipAddress,
  userAgent,
  timestamp = new Date().toUTCString(),
  location = 'Unknown Location',
}: TryToLoginTemplateParams): EmailContent {
  const subject = `Security Alert: New Sign-In to Your OneAPI Account`;

  const bodyContent = `
    <div class="greeting">Hello ${name || 'User'},</div>
    <p>A new sign-in attempt was detected for your OneAPI account (<strong>${email}</strong>).</p>

    <table class="info-table">
      <tr>
        <td class="label">Time (UTC)</td>
        <td class="value">${timestamp}</td>
      </tr>
      <tr>
        <td class="label">IP Address</td>
        <td class="value">${ipAddress || 'Not recorded'}</td>
      </tr>
      <tr>
        <td class="label">Browser / Device</td>
        <td class="value">${userAgent || 'Unknown Device'}</td>
      </tr>
      <tr>
        <td class="label">Location</td>
        <td class="value">${location}</td>
      </tr>
    </table>

    <p>If this was you, you can safely ignore this notification.</p>

    <div class="danger-box">
      <strong>Didn't recognize this activity?</strong><br>
      If you did not sign in recently, someone else may have obtained your password. We strongly recommend that you reset your password immediately and secure your account.
    </div>

    <div style="text-align: center;">
      <a href="#" class="btn" style="background-color: #ef4444;">Review Account Security</a>
    </div>
  `;

  const html = renderBaseEmailLayout({
    title: 'New Sign-In Detected',
    previewText: `New sign-in detected from IP ${ipAddress || 'unknown'} at ${timestamp}.`,
    bodyContent,
    footerText: 'OneAPI Automated Security Monitor',
  });

  const text = `Hello ${name || 'User'},

A new sign-in was detected for your OneAPI account (${email}).

Sign-In Details:
- Time: ${timestamp}
- IP Address: ${ipAddress}
- Device / Browser: ${userAgent}
- Location: ${location}

If this was you, no action is needed.

If you did NOT attempt this login, your password may be compromised. Please reset your password immediately to protect your account.
`;

  return { subject, html, text };
}
