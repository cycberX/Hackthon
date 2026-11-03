export interface BaseEmailLayoutOptions {
  title: string;
  previewText?: string;
  bodyContent: string;
  footerText?: string;
}

/**
 * Reusable, responsive HTML email layout with dark/light mode compatibility,
 * sleek modern typography, and responsive cards.
 */
export function renderBaseEmailLayout({
  title,
  previewText = '',
  bodyContent,
  footerText = 'This is an automated security notification. If you did not request this, please contact support immediately.',
}: BaseEmailLayoutOptions): string {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f9;
      padding: 40px 16px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header-logo {
      font-size: 24px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: -0.5px;
      text-decoration: none;
      display: inline-block;
    }
    .header-tagline {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 6px;
    }
    .content {
      padding: 32px 28px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .otp-card {
      background-color: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #0284c7;
      display: inline-block;
    }
    .otp-expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
    }
    .info-table td {
      padding: 10px 14px;
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-table td.label {
      font-weight: 600;
      color: #475569;
      width: 35%;
    }
    .info-table td.value {
      color: #0f172a;
      font-family: monospace;
    }
    .alert-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 14px 16px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
      color: #92400e;
    }
    .danger-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 14px 16px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
      color: #991b1b;
    }
    .btn {
      display: inline-block;
      background-color: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 16px 0;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="header-logo">⚡ OneAPI</a>
        <div class="header-tagline">Secure Authentication & API Service</div>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p>${footerText}</p>
        <p>© ${currentYear} OneAPI. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
