import { renderBaseEmailLayout } from './baseLayout.js';
import type { EmailContent } from './signupOtp.template.js';

export interface ApiKeyCreatedTemplateParams {
  name: string;
  email: string;
  keyName: string;
  keyPrefix: string;
  timestamp?: string;
  ipAddress?: string;
}

/**
 * Generates the email template when a new API key has been created.
 */
export function getApiKeyCreatedTemplate({
  name,
  email,
  keyName,
  keyPrefix,
  timestamp = new Date().toUTCString(),
  ipAddress = 'Unknown IP',
}: ApiKeyCreatedTemplateParams): EmailContent {
  const subject = `New API Key Generated: "${keyName}" - OneAPI`;

  const bodyContent = `
    <div class="greeting">Hello ${name || 'Developer'},</div>
    <p>A new API key was successfully generated for your OneAPI account (<strong>${email}</strong>).</p>

    <table class="info-table">
      <tr>
        <td class="label">Key Name</td>
        <td class="value">${keyName}</td>
      </tr>
      <tr>
        <td class="label">Key Identifier</td>
        <td class="value"><code>${keyPrefix}</code></td>
      </tr>
      <tr>
        <td class="label">Created At</td>
        <td class="value">${timestamp}</td>
      </tr>
      <tr>
        <td class="label">Created From IP</td>
        <td class="value">${ipAddress}</td>
      </tr>
    </table>

    <div class="alert-box">
      <strong>Security Best Practices:</strong>
      <ul style="margin: 6px 0 0 16px; padding: 0;">
        <li>For security reasons, the full secret key is only displayed once in your console/response.</li>
        <li>Never commit API keys into GitHub or public source repositories.</li>
        <li>Store keys safely using environment variables (.env files).</li>
      </ul>
    </div>

    <p style="color: #64748b; font-size: 13px;">If you did not authorize the creation of this API key, revoke it immediately from your OneAPI dashboard to prevent unauthorized API requests.</p>
  `;

  const html = renderBaseEmailLayout({
    title: 'New API Key Created',
    previewText: `API Key "${keyName}" (${keyPrefix}) was created on ${timestamp}.`,
    bodyContent,
    footerText: 'OneAPI Developer Security Notifications',
  });

  const text = `Hello ${name || 'Developer'},

A new API key has been generated for your OneAPI account (${email}).

API Key Details:
- Key Name: ${keyName}
- Key Prefix: ${keyPrefix}
- Created At: ${timestamp}
- Created From IP: ${ipAddress}

Important Security Notice:
- Your secret key is only shown once and cannot be recovered.
- Never commit secret keys to version control systems like GitHub.
- If you did not create this key, revoke it immediately in your dashboard.
`;

  return { subject, html, text };
}
