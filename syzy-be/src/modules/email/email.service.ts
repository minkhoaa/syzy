import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: string;
  private resendClient: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<string>('EMAIL_PROVIDER') ?? 'resend';

    if (this.provider === 'resend') {
      const apiKey = this.configService.get<string>('RESEND_API_KEY');
      if (apiKey) {
        this.resendClient = new Resend(apiKey);
        this.logger.log('Resend email provider configured');
      } else {
        this.logger.warn('RESEND_API_KEY not set — email sending disabled');
      }
    }
  }

  async sendWaitlistConfirmation(
    to: string,
    walletAddress: string,
    referralCode: string,
  ): Promise<EmailResult> {
    const subject = 'Welcome to Syzy Waitlist';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff;">
        <h2 style="color: #14b8a6;">You&apos;re on the list.</h2>
        <p>Your wallet <code style="background: #1a1a1a; padding: 2px 6px; border-radius: 4px;">${walletAddress}</code> has been registered for the Syzy waitlist.</p>
        <p><strong>Your referral code:</strong> <code style="background: #1a1a1a; padding: 2px 6px; border-radius: 4px;">${referralCode}</code></p>
        <p>Share your link to climb the queue: <a href="${this.configService.get<string>('WAITLIST_APP_ORIGIN') ?? 'https://syzy.fun'}/waitlist?ref=${referralCode}" style="color: #14b8a6;">View your spot</a></p>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">Predict Invisible. Win Visible.</p>
      </div>
    `;

    if (this.provider === 'resend' && this.resendClient) {
      return this.sendViaResend(to, subject, html);
    }

    this.logger.warn(`[EmailService] Waitlist confirmation would be sent to ${to}`);
    return { success: true, providerMessageId: `mock-${Date.now()}` };
  }

  async sendAccessUnlocked(
    to: string,
    walletAddress: string,
    rank: number,
    referralCode: string,
  ): Promise<EmailResult> {
    const subject = 'Your Syzy Early Access Is Ready';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff;">
        <h2 style="color: #14b8a6;">Early access unlocked.</h2>
        <p>Great news — you&apos;ve reached the front of the Syzy waitlist.</p>
        <p><strong>Your rank:</strong> #${rank}</p>
        ${referralCode ? `<p><strong>Referral code:</strong> <code style="background: #1a1a1a; padding: 2px 6px; border-radius: 4px;">${referralCode}</code></p>` : ''}
        <a href="${this.configService.get<string>('WAITLIST_APP_ORIGIN') ?? 'https://syzy.fun'}/dashboard" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #14b8a6; color: #000; border-radius: 8px; text-decoration: none; font-weight: 600;">Launch App</a>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">Predict Invisible. Win Visible.</p>
      </div>
    `;

    if (this.provider === 'resend' && this.resendClient) {
      return this.sendViaResend(to, subject, html);
    }

    this.logger.warn(`[EmailService] Access unlocked would be sent to ${to}`);
    return { success: true, providerMessageId: `mock-${Date.now()}` };
  }

  private async sendViaResend(to: string, subject: string, html: string): Promise<EmailResult> {
    if (!this.resendClient) {
      return { success: false, error: 'Resend client not initialized' };
    }

    const from = this.configService.get<string>('EMAIL_FROM') ?? 'waitlist@syzy.fun';

    try {
      const { data, error } = await this.resendClient.emails.send({ from, to, subject, html });

      if (error) {
        this.logger.error(`Resend error: ${error.message}`);
        return { success: false, error: error.message };
      }

      this.logger.log(`Email sent via Resend to ${to}: ${data?.id}`);
      return { success: true, providerMessageId: data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email via Resend to ${to}: ${message}`);
      return { success: false, error: message };
    }
  }
}
