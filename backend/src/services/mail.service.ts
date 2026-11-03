import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import {
  getSignupOtpTemplate,
  getTryToLoginTemplate,
  getApiKeyCreatedTemplate,
  getForgotPasswordTemplate,
  getPasswordResetSuccessTemplate,
  getEmailVerifiedWelcomeTemplate,
  type EmailContent,
  type SignupOtpTemplateParams,
  type TryToLoginTemplateParams,
  type ApiKeyCreatedTemplateParams,
  type ForgotPasswordTemplateParams,
  type PasswordResetSuccessParams,
  type EmailVerifiedWelcomeParams,
} from './email/index.js';

class MailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = env.EMAIL;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      this.isConfigured = true;
      console.log(`[MailService] Configured with SMTP host: ${SMTP_HOST}:${SMTP_PORT}`);
    } else {
      this.isConfigured = false;
      console.log('[MailService] SMTP credentials not provided in .env - Running in Development / Console Mode');
    }
  }

  /**
   * Low-level send method. Dispatches via Nodemailer or logs to console in dev mode.
   */
  public async send({
    to,
    content,
  }: {
    to: string;
    content: EmailContent;
  }): Promise<{ messageId?: string; devMode?: boolean }> {
    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: env.EMAIL.FROM,
          to,
          subject: content.subject,
          text: content.text,
          html: content.html,
        });
        console.log(`[MailService] Email sent to ${to}. MessageId: ${info.messageId}`);
        return { messageId: info.messageId, devMode: false };
      } catch (err: any) {
        console.error(`[MailService] Failed to send email via SMTP to ${to}:`, err.message);
        // Fall back to console log so process does not crash
      }
    }

    // Development Console Output for instant local testing without an SMTP server
    console.log('\n======================================================');
    console.log(`📧 [EMAIL DISPATCHED] (Development Console Mode)`);
    console.log(`To: ${to}`);
    console.log(`From: ${env.EMAIL.FROM}`);
    console.log(`Subject: ${content.subject}`);
    console.log('------------------------------------------------------');
    console.log(content.text.trim());
    console.log('======================================================\n');

    return { devMode: true };
  }

  /**
   * Sends Signup Verification OTP Email
   */
  public async sendSignupOtp(to: string, params: Omit<SignupOtpTemplateParams, 'email'>): Promise<void> {
    const content = getSignupOtpTemplate({ ...params, email: to });
    await this.send({ to, content });
  }

  /**
   * Sends "Try to login" / New sign-in alert email
   */
  public async sendTryToLoginAlert(to: string, params: Omit<TryToLoginTemplateParams, 'email'>): Promise<void> {
    const content = getTryToLoginTemplate({ ...params, email: to });
    await this.send({ to, content });
  }

  /**
   * Sends "API Key Created" notification email
   */
  public async sendApiKeyCreated(to: string, params: Omit<ApiKeyCreatedTemplateParams, 'email'>): Promise<void> {
    const content = getApiKeyCreatedTemplate({ ...params, email: to });
    await this.send({ to, content });
  }

  /**
   * Sends Forgot Password OTP Email
   */
  public async sendForgotPasswordOtp(to: string, params: Omit<ForgotPasswordTemplateParams, 'email'>): Promise<void> {
    const content = getForgotPasswordTemplate({ ...params, email: to });
    await this.send({ to, content });
  }

  /**
   * Sends Password Changed confirmation email
   */
  public async sendPasswordResetSuccess(to: string, params: Omit<PasswordResetSuccessParams, 'email'>): Promise<void> {
    const content = getPasswordResetSuccessTemplate({ ...params, email: to });
    await this.send({ to, content });
  }

  /**
   * Sends Email Verified Welcome email
   */
  public async sendWelcomeVerified(to: string, params: Omit<EmailVerifiedWelcomeParams, 'email'>): Promise<void> {
    const content = getEmailVerifiedWelcomeTemplate({ ...params, email: to });
    await this.send({ to, content });
  }
}

export const mailService = new MailService();
