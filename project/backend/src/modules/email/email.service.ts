import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SMTPClient } from 'smtp-client';
import axios from 'axios';
import { db } from '../../config/database';

export interface EmailLogOptions {
  notificationType?: string;
  recipientName?: string;
  recipientUserId?: string;
  templateName?: string;
  triggeredByUserId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
  fromName?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) { }

  private getFrontendUrl(): string {
    const url = this.configService.get<string>('FRONTEND_URL') || 'https://investmentportalfrontend.vercel.app';
    return url.replace(/\/$/, '');
  }

  private getPublicLogoUrl(): string {
    const customLogo = this.configService.get<string>('EMAIL_LOGO_URL');
    if (customLogo) return customLogo;
    let url = this.configService.get<string>('FRONTEND_URL') || 'https://investmentportalfrontend.vercel.app';
    if (url.includes('localhost') || url.includes('127.0.0.1') || !url.startsWith('http')) {
      url = 'https://investmentportalfrontend.vercel.app';
    }
    return `${url.replace(/\/$/, '')}/images/logo26022026.png`;
  }

  private getSupportEmail(): string {
    return this.configService.get<string>('SUPPORT_EMAIL') || 'portal@ovaliacapital.com';
  }

  async sendPasswordResetOtp(email: string, otp: string, showCode: boolean = true, options?: EmailLogOptions) {
    const title = 'Verify Your Identity';
    const subject = 'Password Reset Code - Ovalia Capital';
    const frontendUrl = this.getFrontendUrl();
    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Password Reset</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">You have requested to reset your password. Please click the button below to set a new password for your account.</p>
      
      ${showCode ? `
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">Alternatively, you can use the verification code below on the reset screen:</p>
      <div style="background-color: #FFFBEB; border: 2px dashed #FBCB4B; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #1F1F1F; letter-spacing: 8px; font-family: monospace;">${otp}</span>
      </div>
      ` : ''}

      <p style="margin: 20px 0 0; font-size: 14px; color: #6B7280; font-style: italic;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/auth/forgot-password?email=${email}&otp=${otp}&flow=investor" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          Reset Password
        </a>
      </div>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'PASSWORD_RESET',
      templateName: 'password_reset_otp',
      metadata: { showCode },
      ...options,
    });
  }

  async sendVerificationOtp(email: string, otp: string, options?: EmailLogOptions) {
    const title = 'Verify Your Email';
    const subject = 'Verification Code - Ovalia Capital';
    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Email Verification</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">Thank you for starting your onboarding with <strong>Ovalia Capital</strong>. Please use the verification code below to confirm your email address and continue your setup.</p>
      
      <div style="background-color: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #1F3B6E; letter-spacing: 10px; font-family: 'Courier New', monospace;">${otp}</span>
      </div>

      <p style="margin: 20px 0 0; font-size: 14px; color: #64748B; font-style: italic;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'VERIFICATION_CODE',
      templateName: 'email_verification_otp',
      ...options,
    });
  }

  async sendWelcomeEmail(email: string, firstName: string, role: string, password?: string, options?: EmailLogOptions) {
    const title = 'Welcome to Ovalia Capital';
    const subject = 'Your Journey Begins - Welcome to Ovalia Capital!';
    const frontendUrl = this.getFrontendUrl();
    const supportEmail = this.getSupportEmail();
    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Welcome Aboard, ${firstName}!</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        We are thrilled to have you join the <strong>Ovalia Capital</strong> as an ${role.charAt(0).toUpperCase() + role.slice(1)}.
      </p>
      
      <!-- Account Details Section -->
      <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 30px 0; border: 1px solid #E5E7EB;">
        <h3 style="margin: 0 0 15px; font-size: 16px; color: #374151; text-transform: uppercase; letter-spacing: 1px;">Your Account Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 5px 0; color: #6B7280; font-size: 14px; width: 100px;"><strong>Email:</strong></td>
            <td style="padding: 5px 0; color: #1F1F1F; font-size: 14px;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6B7280; font-size: 14px;"><strong>Account:</strong></td>
            <td style="padding: 5px 0; color: #1F1F1F; font-size: 14px;">${role.charAt(0).toUpperCase() + role.slice(1)}</td>
          </tr>
        </table>
      </div>

      <h3 style="margin: 0 0 15px; font-size: 18px; color: #1F1F1F;">What's Next?</h3>
      <ul style="padding: 0; margin: 0 0 30px 20px; color: #4B5563; font-size: 15px; line-height: 1.8;">
        <li><strong>Complete Your Profile:</strong> Head to settings to ensure all your information is up to date.</li>
        <li><strong>Secure Your Account:</strong> We highly recommend enabling Two-Factor Authentication (2FA) in your security settings.</li>
        <li><strong>Explore the Dashboard:</strong> View your portfolio, track performance, and manage your digital assets.</li>
      </ul>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/auth/login?flow=${role.toLowerCase()}" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          Go to Dashboard
        </a>
      </div>

      <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 20px;">
        Need help? Contact our support team at <a href="mailto:${supportEmail}" style="color: #2A4474; text-decoration: none;">${supportEmail}</a>
      </p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'WELCOME_EMAIL',
      templateName: 'welcome_email',
      recipientName: firstName,
      metadata: { role },
      ...options,
    });
  }

  async sendPasswordChangedEmail(email: string, firstName: string, password?: string, options?: EmailLogOptions) {
    const title = 'Security Update';
    const subject = 'Password Successfully Updated - Ovalia Capital';
    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Password Updated</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">Hello ${firstName},</p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        Your password has been successfully updated. This is a security confirmation to ensure you made this change.
      </p>

      ${password ? `
      <!-- New Password Details -->
      <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #E5E7EB;">
        <p style="margin: 0; font-size: 14px; color: #6B7280;"><strong>New Password:</strong></p>
        <p style="margin: 5px 0 0; font-size: 16px; color: #1F1F1F; font-family: monospace;"><code>${password}</code></p>
      </div>
      ` : ''}

      <div style="background-color: #FFF5F5; border-left: 4px solid #E53E3E; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 13px; color: #9B2C2C; line-height: 1.5;">
          <strong>SECURITY NOTE:</strong> If you did not authorize this password change, please contact our support team immediately to secure your account.
        </p>
      </div>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'PASSWORD_CHANGED',
      templateName: 'password_changed_confirmation',
      recipientName: firstName,
      ...options,
    });
  }

  async sendStaffWelcomeEmail(email: string, fullName: string, role: string, password: string, options?: EmailLogOptions) {
    const title = 'Welcome to the Team';
    const subject = 'Welcome to Ovalia Capital - Your Staff Account Details';

    // Map internal role IDs to human-readable names
    const roleMap: Record<string, string> = {
      'admin': 'Administrator',
      'fund_admin': 'Fund Administrator',
      'investor_relations': 'Investor Relations Manager',
      'accountant': 'Accountant',
      'executive_admin': 'Executive Administrator',
      'relations_associate': 'Relations Associate',
      'partnership': 'Partnership Manager'
    };

    const roleName = roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);

    const flow = role.toLowerCase() === 'accountant' ? 'accountant' : 'admin';
    const buttonText = flow === 'accountant' ? 'Login to Accountant Portal' : 'Login to Admin Portal';
    const frontendUrl = this.getFrontendUrl();
    const supportEmail = this.getSupportEmail();

    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Welcome to the Team, ${fullName}!</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        We are excited to inform you that you have been added as a <strong>${roleName}</strong> on the <strong>Ovalia Capital</strong>.
      </p>
      
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        As part of your role, you can log in to the ${flow} portal to manage relevant data and operations.
      </p>

      <!-- Account Details Section -->
      <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 30px 0; border: 1px solid #E5E7EB;">
        <h3 style="margin: 0 0 15px; font-size: 16px; color: #374151; text-transform: uppercase; letter-spacing: 1px;">Your Login Credentials</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 5px 0; color: #6B7280; font-size: 14px; width: 100px;"><strong>Email:</strong></td>
            <td style="padding: 5px 0; color: #1F1F1F; font-size: 14px;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6B7280; font-size: 14px;"><strong>Password:</strong></td>
            <td style="padding: 5px 0; color: #1F1F1F; font-size: 14px;"><code>${password}</code></td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/auth/login?flow=${flow}" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          ${buttonText}
        </a>
      </div>

      <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 20px;">
        Need assistance? Please contact your system administrator or reach out to support at <a href="mailto:${supportEmail}" style="color: #2A4474; text-decoration: none;">${supportEmail}</a>
      </p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'STAFF_WELCOME',
      templateName: 'staff_credentials',
      recipientName: fullName,
      metadata: { role },
      ...options,
    });
  }

  async sendInvestorInvitationEmail(email: string, fullName: string, token: string, options?: EmailLogOptions) {
    const title = 'Invitation to Ovalia Capital';
    const subject = 'You have been invited to join the Ovalia Capital';
    const frontendUrl = this.getFrontendUrl();
    const inviteLink = `${frontendUrl}/auth/investor-signup?invite=${token}`;
    const supportEmail = this.getSupportEmail();

    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Exclusive Invitation</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        Hello ${fullName || 'Valued Investor'},
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        You have been personally invited to join <strong>Ovalia Capital. Welcome!</strong>
      </p>
      
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        Our platform provides you with a secure and seamless way to manage your investments and retirement accounts. The platform is designed to bring clarity and simplicity to a sophisticated system of building generational wealth. 
      </p>

      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        To get started and set up your account, please follow the link below. Your registration has been started for you.
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${inviteLink}" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          Complete Your Registration
        </a>
      </div>

      <div style="background-color: #FEF3C7; border-left: 4px solid #FBCB4B; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px; color: #92400E; line-height: 1.6; font-weight: bold;">
          ⚠️ SECURITY NOTICE: Expiration Limit
        </p>
        <p style="margin: 10px 0 0; font-size: 14px; color: #B45309;">
          For your protection, this unique invitation link will <strong>expire in strictly 3 days (72 hours)</strong>. If the link expires, you will need to request a new invitation from your advisor.
        </p>
      </div>

      <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 20px;">
        Need help? Contact our support team at <a href="mailto:${supportEmail}" style="color: #2A4474; text-decoration: none;">${supportEmail}</a>
      </p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'INVITE_INVESTOR',
      templateName: 'investor_invitation',
      recipientName: fullName,
      metadata: { inviteTokenLength: token?.length },
      ...options,
    });
  }

  async sendCustomEmail(email: string, fullName: string, subject: string, body: string, options?: EmailLogOptions) {
    const title = subject;
    const supportEmail = this.getSupportEmail();
    const isHtmlBody = body.includes('<') && body.includes('>');
    
    const content = isHtmlBody ? `
      ${body}
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.5; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 16px;">
        Need help? Contact our support team at <a href="mailto:${supportEmail}" style="color: #2A4474; text-decoration: none;">${supportEmail}</a>
      </p>
    ` : `
      <h1 style="margin: 0 0 16px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 24px;">${subject}</h1>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #4B5563;">
        Hello ${fullName || 'Valued Investor'},
      </p>
      <div style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #4B5563; white-space: pre-line;">
        ${body}
      </div>
      <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.5; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 16px;">
        Need help? Contact our support team at <a href="mailto:${supportEmail}" style="color: #2A4474; text-decoration: none;">${supportEmail}</a>
      </p>
    `;
    const html = this.getHtmlTemplate(content, title);
    
    const logOptions: EmailLogOptions = {
      notificationType: 'CUSTOM_EMAIL',
      templateName: 'custom_email',
      recipientName: fullName,
      ...options,
    };

    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY') || process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      try {
        await this.sendBrevoEmail(email, subject, html, logOptions);
        return;
      } catch (err: any) {
        this.logger.warn(`Brevo dispatch failed in sendCustomEmail, falling back to SMTP transport: ${err.message}`);
      }
    }

    await this.sendEmail(email, subject, html, logOptions);
  }

  async sendInvestmentInvite(email: string, firstName: string, fundName: string, amount: string, token: string, options?: EmailLogOptions) {
    const title = 'Investment Invitation';
    const subject = `Investment Invitation - ${fundName} - Ovalia Capital`;
    const frontendUrl = this.getFrontendUrl();
    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Investment Invitation</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">Hello ${firstName},</p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">You have been invited to invest <strong>$${amount}</strong> in <strong>${fundName}</strong>.</p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">Click the button below to review and finalize your investment. Your account details and investment amount will be automatically filled in for your convenience.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${frontendUrl}/dashboard/invest?inviteToken=${token}" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          Review Investment
        </a>
      </div>
      <p style="margin: 20px 0 0; font-size: 14px; color: #6B7280; font-style: italic;">If the button above does not work, copy and paste the following link into your browser:</p>
      <p style="margin: 10px 0 0; font-size: 14px; color: #1F3B6E; word-break: break-all;"><a href="${frontendUrl}/dashboard/invest?inviteToken=${token}">${frontendUrl}/dashboard/invest?inviteToken=${token}</a></p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'INVESTMENT_INVITE',
      templateName: 'fund_investment_invitation',
      recipientName: firstName,
      metadata: { fundName, amount },
      ...options,
    });
  }

  private getHtmlTemplate(content: string, title: string) {
    const frontendUrl = this.getFrontendUrl();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #2A4474; padding: 5px; text-align: center;"></td>
          </tr>
          <!-- Logo Section -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;" align="center">
              <img src="${this.getPublicLogoUrl()}" width="100" border="0" alt="Ovalia Capital" style="width:100px; max-width:100px; height:auto; display:block; margin:0 auto; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic;">
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F9FAFB; border-top: 1px solid #F3F4F6; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #9CA3AF;">&copy; 2026 Ovalia Capital. All rights reserved.</p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #BEC3CC;">
                This is an automated security notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendBrevoEmail(to: string, subject: string, html: string, options?: EmailLogOptions) {
    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY') || process.env.BREVO_API_KEY;
    const rawFrom = this.configService.get<string>('BREVO_SENDER_EMAIL') || process.env.BREVO_SENDER_EMAIL || 'portal@ovaliacapital.com';
    const fromName = this.configService.get<string>('BREVO_SENDER_NAME') || process.env.BREVO_SENDER_NAME || 'Ovalia Capital';

    const extractEmail = (str: string) => {
      const match = str.match(/<(.+)>/);
      return match ? match[1] : str.trim();
    };

    const rawTo = extractEmail(to);
    const snippet = this.extractTextSnippet(html);
    const notifType = options?.notificationType || 'CUSTOM_EMAIL';

    if (!brevoApiKey) {
      this.logger.error('❌ Brevo API Key missing.');
      await this.logEmailNotification({
        notificationType: notifType,
        recipientEmail: rawTo,
        recipientName: options?.recipientName,
        recipientUserId: options?.recipientUserId,
        subject,
        templateName: options?.templateName,
        bodySnippet: snippet,
        status: 'FAILED',
        provider: 'brevo',
        errorMessage: 'Brevo API Key (BREVO_API_KEY) missing or invalid.',
        triggeredByUserId: options?.triggeredByUserId,
        relatedEntityType: options?.relatedEntityType,
        relatedEntityId: options?.relatedEntityId,
        metadata: options?.metadata,
        failedAt: new Date(),
      });
      throw new Error('Brevo API Key (BREVO_API_KEY) missing or invalid.');
    }

    const textContent = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: fromName, email: rawFrom },
          to: [{ email: rawTo }],
          subject: subject,
          htmlContent: html,
          textContent: textContent,
        },
        {
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        }
      );
      const messageId = response.data?.messageId || null;
      this.logger.log(`✅ [Brevo API] Email sent successfully to ${rawTo}: ${subject}`);

      await this.logEmailNotification({
        notificationType: notifType,
        recipientEmail: rawTo,
        recipientName: options?.recipientName,
        recipientUserId: options?.recipientUserId,
        subject,
        templateName: options?.templateName,
        bodySnippet: snippet,
        status: 'SENT',
        provider: 'brevo',
        providerMessageId: messageId,
        triggeredByUserId: options?.triggeredByUserId,
        relatedEntityType: options?.relatedEntityType,
        relatedEntityId: options?.relatedEntityId,
        metadata: options?.metadata,
        sentAt: new Date(),
      });
    } catch (error: any) {
      const errMsg = error?.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`❌ [Brevo API Error] Failed sending email to ${rawTo}: ${errMsg}`, error.stack);
      await this.logEmailNotification({
        notificationType: notifType,
        recipientEmail: rawTo,
        recipientName: options?.recipientName,
        recipientUserId: options?.recipientUserId,
        subject,
        templateName: options?.templateName,
        bodySnippet: snippet,
        status: 'FAILED',
        provider: 'brevo',
        errorMessage: errMsg,
        triggeredByUserId: options?.triggeredByUserId,
        relatedEntityType: options?.relatedEntityType,
        relatedEntityId: options?.relatedEntityId,
        metadata: options?.metadata,
        failedAt: new Date(),
      });
      throw new Error(`Brevo API Error: ${errMsg}`);
    }
  }

  async sendEmail(to: string, subject: string, html: string, options?: EmailLogOptions) {
    const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('EMAIL_FROM') || '"Ovalia Capital" <portal@ovaliacapital.com>';

    const extractEmail = (str: string) => {
      const match = str.match(/<(.+)>/);
      return match ? match[1] : str.trim();
    };

    const extractName = (str: string) => {
      const match = str.match(/^"(.+)"/);
      if (match) return match[1];
      const matchNoQuotes = str.match(/^([^<]+)\s*</);
      return matchNoQuotes ? matchNoQuotes[1].trim() : 'Ovalia Capital';
    };

    const senderDisplayName = options?.fromName || extractName(from);
    const fromHeader = `"${senderDisplayName}" <${extractEmail(from)}>`;
    const rawFrom = extractEmail(from);
    const rawTo = extractEmail(to);
    const snippet = this.extractTextSnippet(html);
    const notifType = options?.notificationType || 'GENERAL_EMAIL';

    // 2. Fallback / Standard SMTP method
    const host = this.configService.get<string>('SMTP_HOST') || this.configService.get<string>('EMAIL_HOST');
    const portString = this.configService.get<string>('SMTP_PORT') || this.configService.get<string>('EMAIL_PORT');
    const port = portString ? parseInt(portString, 10) : 587;
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('EMAIL_PASS');

    if (host && port && user && pass) {
      const client = new SMTPClient({ host, port });

      try {
        await client.connect();
        await client.greet({ hostname: host });

        if (port === 587) {
          await client.secure();
          await client.greet({ hostname: host });
        }

        await client.authPlain({ username: user, password: pass });

        await client.mail({ from: rawFrom });
        await client.rcpt({ to: rawTo });

        const textContent = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const boundary = "----=_Part_" + Date.now();
        const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@ovaliacapital.com>`;
        const message = `From: ${fromHeader}\r\nTo: ${to}\r\nSubject: ${subject}\r\nMessage-ID: ${messageId}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n` +
          `--${boundary}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${textContent}\r\n\r\n` +
          `--${boundary}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${html}\r\n\r\n` +
          `--${boundary}--`;

        await client.data(message);
        await client.quit();

        this.logger.log(`✅ [SMTP] Email sent to ${to}: ${subject}`);

        await this.logEmailNotification({
          notificationType: notifType,
          recipientEmail: rawTo,
          recipientName: options?.recipientName,
          recipientUserId: options?.recipientUserId,
          subject,
          templateName: options?.templateName,
          bodySnippet: snippet,
          status: 'SENT',
          provider: 'smtp',
          providerMessageId: messageId,
          triggeredByUserId: options?.triggeredByUserId,
          relatedEntityType: options?.relatedEntityType,
          relatedEntityId: options?.relatedEntityId,
          metadata: options?.metadata,
          sentAt: new Date(),
        });
      } catch (error: any) {
        this.logger.error(`❌ SMTP Error sending to ${to}: ${error.message}`, error.stack);
        await this.logEmailNotification({
          notificationType: notifType,
          recipientEmail: rawTo,
          recipientName: options?.recipientName,
          recipientUserId: options?.recipientUserId,
          subject,
          templateName: options?.templateName,
          bodySnippet: snippet,
          status: 'FAILED',
          provider: 'smtp',
          errorMessage: error.message,
          triggeredByUserId: options?.triggeredByUserId,
          relatedEntityType: options?.relatedEntityType,
          relatedEntityId: options?.relatedEntityId,
          metadata: options?.metadata,
          failedAt: new Date(),
        });
        throw new Error(`Could not send email to ${to}`);
      }
    } else {
      this.logger.warn('⚠️ Email service configuration missing (No BREVO_API_KEY or SMTP credentials). Running in dummy mode.');
      this.this_is_dummy_log(to, subject);

      await this.logEmailNotification({
        notificationType: notifType,
        recipientEmail: rawTo,
        recipientName: options?.recipientName,
        recipientUserId: options?.recipientUserId,
        subject,
        templateName: options?.templateName,
        bodySnippet: snippet,
        status: 'SENT',
        provider: 'dummy',
        providerMessageId: `dummy-${Date.now()}`,
        triggeredByUserId: options?.triggeredByUserId,
        relatedEntityType: options?.relatedEntityType,
        relatedEntityId: options?.relatedEntityId,
        metadata: options?.metadata,
        sentAt: new Date(),
      });
    }
  }

  private this_is_dummy_log(to: string, subject: string) {
    this.logger.log('--- DUMMY EMAIL LOG ---');
    this.logger.log(`To: ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log('-----------------------');
  }

  async sendFundTransferSignatureEmail(email: string, signerName: string, signLink: string, options?: EmailLogOptions) {
    const title = 'Document Signature Required';
    const subject = 'Action Required: Please sign the Fund Transfer Document';
    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Signature Required</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        Hello <strong>${signerName}</strong>,
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        You have a new fund transfer document that requires your signature. Please review and sign the document to proceed with the transfer.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${signLink}" style="display: inline-block; background-color: #1F3B6E; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; border: 2px solid #1F3B6E; transition: all 0.3s ease;">
          Review and Sign Document
        </a>
      </div>
      
      <p style="margin: 0 0 10px; font-size: 14px; color: #6B7280; font-style: italic;">
        If the button above does not work, please copy and paste the following link into your browser:
      </p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #1F3B6E; word-break: break-all;">
        ${signLink}
      </p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'FUND_TRANSFER',
      templateName: 'fund_transfer_signature_request',
      recipientName: signerName,
      ...options,
    });
  }

  async sendCampaignSignatureEmail(email: string, signerName: string, documentName: string, signLink: string, options?: EmailLogOptions) {
    const title = 'Document Signature Required';
    const subject = `Action Required: Please sign ${documentName}`;
    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Signature Required</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        Hello <strong>${signerName}</strong>,
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        You have a new document (<strong>${documentName}</strong>) that requires your signature. Please review and sign the document.
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${signLink}" style="display: inline-block; background-color: #1F3B6E; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; border: 2px solid #1F3B6E; transition: all 0.3s ease;">
          Review and Sign Document
        </a>
      </div>
      
      <p style="margin: 0 0 10px; font-size: 14px; color: #6B7280; font-style: italic;">
        If the button above does not work, please copy and paste the following link into your browser:
      </p>
      <p style="margin: 0 0 20px; font-size: 14px; color: #1F3B6E; word-break: break-all;">
        ${signLink}
      </p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title), {
      notificationType: 'DOCUMENT_SIGNATURE',
      templateName: 'document_signature_request',
      recipientName: signerName,
      metadata: { documentName },
      ...options,
    });
  }

  private async resolveRecipient(email: string): Promise<{ recipientUserId?: string; recipientName?: string; relatedEntityType?: string }> {
    if (!email) return {};
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Check users table
      const userRes = await db.query(
        'SELECT id, first_name, last_name FROM users WHERE LOWER(email) = $1 LIMIT 1',
        [cleanEmail]
      );
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
        return {
          recipientUserId: String(u.id),
          recipientName: name || undefined,
          relatedEntityType: 'USER',
        };
      }

      // 2. Check investors table
      const invRes = await db.query(
        'SELECT id, full_name FROM investors WHERE LOWER(email) = $1 LIMIT 1',
        [cleanEmail]
      );
      if (invRes.rows.length > 0) {
        const inv = invRes.rows[0];
        return {
          recipientUserId: String(inv.id),
          recipientName: inv.full_name || undefined,
          relatedEntityType: 'INVESTOR',
        };
      }

      // 3. Check doctor_prospects table (apollo_id)
      const docRes = await db.query(
        'SELECT apollo_id, full_name FROM doctor_prospects WHERE LOWER(email) = $1 LIMIT 1',
        [cleanEmail]
      );
      if (docRes.rows.length > 0) {
        const doc = docRes.rows[0];
        return {
          recipientUserId: String(doc.apollo_id),
          recipientName: doc.full_name || undefined,
          relatedEntityType: 'DOCTOR_PROSPECT',
        };
      }

      // 4. Check staff table
      const staffRes = await db.query(
        'SELECT id, full_name FROM staff WHERE LOWER(email) = $1 LIMIT 1',
        [cleanEmail]
      );
      if (staffRes.rows.length > 0) {
        const s = staffRes.rows[0];
        return {
          recipientUserId: String(s.id),
          recipientName: s.full_name || undefined,
          relatedEntityType: 'STAFF',
        };
      }
    } catch (err: any) {
      this.logger.warn(`Could not resolve recipient for ${cleanEmail}: ${err.message}`);
    }

    return {};
  }

  private async logEmailNotification(logData: {
    notificationType: string;
    recipientEmail: string;
    recipientName?: string | null;
    recipientUserId?: string | null;
    subject: string;
    templateName?: string | null;
    bodySnippet?: string | null;
    status: 'SENT' | 'FAILED' | 'QUEUED';
    provider?: string | null;
    providerMessageId?: string | null;
    errorMessage?: string | null;
    triggeredByUserId?: string | null;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    metadata?: any;
    sentAt?: Date | null;
    failedAt?: Date | null;
  }) {
    try {
      let recipientUserId = logData.recipientUserId || null;
      let recipientName = logData.recipientName || null;
      let relatedEntityType = logData.relatedEntityType || null;
      let relatedEntityId = logData.relatedEntityId || null;

      if (!recipientUserId) {
        const resolved = await this.resolveRecipient(logData.recipientEmail);
        if (resolved.recipientUserId) {
          recipientUserId = resolved.recipientUserId;
          if (!relatedEntityType && resolved.relatedEntityType) {
            relatedEntityType = resolved.relatedEntityType;
            if (!relatedEntityId) {
              relatedEntityId = resolved.recipientUserId;
            }
          }
        }
        if (!recipientName && resolved.recipientName) {
          recipientName = resolved.recipientName;
        }
      }

      await db.query(
        `INSERT INTO email_notification_logs (
          notification_type,
          recipient_email,
          recipient_name,
          recipient_user_id,
          subject,
          template_name,
          body_snippet,
          status,
          provider,
          provider_message_id,
          error_message,
          triggered_by_user_id,
          related_entity_type,
          related_entity_id,
          metadata,
          sent_at,
          failed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          logData.notificationType,
          logData.recipientEmail,
          recipientName,
          recipientUserId,
          logData.subject,
          logData.templateName || null,
          logData.bodySnippet || null,
          logData.status,
          logData.provider || null,
          logData.providerMessageId || null,
          logData.errorMessage || null,
          logData.triggeredByUserId || null,
          relatedEntityType,
          relatedEntityId,
          logData.metadata ? JSON.stringify(logData.metadata) : null,
          logData.sentAt || null,
          logData.failedAt || null,
        ]
      );
    } catch (err: any) {
      this.logger.error(`❌ Failed to record email_notification_logs: ${err.message}`);
    }
  }

  private extractTextSnippet(html: string, maxLen = 300): string {
    if (!html) return '';
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  }

  async getEmailNotificationLogs(params?: {
    page?: number;
    limit?: number;
    recipientEmail?: string;
    notificationType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params?.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params?.recipientEmail) {
      conditions.push(`recipient_email ILIKE $${idx++}`);
      values.push(`%${params.recipientEmail}%`);
    }

    if (params?.notificationType) {
      conditions.push(`notification_type = $${idx++}`);
      values.push(params.notificationType);
    }

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    if (params?.startDate) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(params.startDate);
    }

    if (params?.endDate) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(params.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) AS total FROM email_notification_logs ${whereClause}`;
    const dataQuery = `
      SELECT * FROM email_notification_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const [countRes, dataRes] = await Promise.all([
      db.query(countQuery, values),
      db.query(dataQuery, [...values, limit, offset]),
    ]);

    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    return {
      data: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =========================================================================
  // EMAIL CAMPAIGNS (EMAIL UPDATES)
  // =========================================================================

  /**
   * Returns list of available funds with active recipient counts calculated via Fund Holdings engine
   */
  async getCampaignFunds() {
    // 1. Compute holding recipient counts per fund via combined_investments CTE
    const holdingsMapRes = await db.query(`
      WITH combined_investments AS (
        SELECT 
          i.fund_id::text as target_fund_id,
          u.email as email,
          i.estimated_units as units
        FROM investments i
        JOIN investors u ON i.user_id = u.id
        WHERE i.is_reconciled = true

        UNION ALL

        SELECT 
          COALESCE(f.id::text, oi.project_id::text) as target_fund_id,
          COALESCE(o_inv.primary_email, oi.email_address) as email,
          (CAST(NULLIF(regexp_replace(oi.investment_amount::text, '[^0-9.]', '', 'g'), '') AS numeric) / 
           NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), f.unit_price, 1), 0)) as units
        FROM old_investments oi
        LEFT JOIN old_investors o_inv ON oi.investor_profile_id = o_inv.ims_profile_id
        LEFT JOIN funds f ON oi.project_name = f.name
        WHERE oi.investment_amount IS NOT NULL

        UNION ALL

        SELECT 
          i.fund_id::text as target_fund_id,
          u.email as email,
          (-1 * r.units) as units
        FROM redemptions r
        JOIN investments i ON r.investment_id = i.id
        JOIN investors u ON r.investor_id = u.id
        WHERE r.status = 'Processed'

        UNION ALL

        SELECT 
          ft.from_fund_id as target_fund_id,
          u.email as email,
          CASE
            WHEN ft.from_account_type ILIKE 'ims-%' THEN 
              (-1 * ft.investment_amount) / NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), ff.unit_price, 1), 0)
            ELSE 
              (-1 * ft.units)
          END as units
        FROM fund_transfers ft
        JOIN investors u ON ft.from_investor_id = u.id
        LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
        WHERE ft.status = 'COMPLETED'

        UNION ALL

        SELECT 
          COALESCE(ft.to_fund_id, ft.from_fund_id) as target_fund_id,
          u.email as email,
          CASE
            WHEN COALESCE(ft.to_account_type, ft.from_account_type) ILIKE 'ims-%' THEN 
              ft.investment_amount / NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), tf.unit_price, ff.unit_price, 1), 0)
            ELSE 
              ft.units
          END as units
        FROM fund_transfers ft
        JOIN investors u ON COALESCE(ft.to_investor_id, ft.from_investor_id) = u.id
        LEFT JOIN funds tf ON ft.to_fund_id = tf.id::text
        LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
        WHERE ft.status = 'COMPLETED'
      ),
      investor_fund_holdings AS (
        SELECT 
          c.target_fund_id,
          LOWER(TRIM(c.email)) as email,
          SUM(c.units) as net_units
        FROM combined_investments c
        WHERE c.units IS NOT NULL AND c.target_fund_id IS NOT NULL AND c.email IS NOT NULL AND TRIM(c.email) != ''
        GROUP BY c.target_fund_id, LOWER(TRIM(c.email))
        HAVING SUM(c.units) > 0
      )
      SELECT 
        target_fund_id,
        COUNT(DISTINCT email)::int as recipient_count
      FROM investor_fund_holdings
      GROUP BY target_fund_id
    `);

    const countMap = new Map<string, number>();
    for (const row of holdingsMapRes.rows) {
      countMap.set(String(row.target_fund_id), parseInt(row.recipient_count || '0', 10));
    }

    // Consolidated total distinct active investors with net holdings > 0 across any fund
    const consolidatedRecipients = await this.getFundRecipients('all-funds');
    const totalConsolidated = consolidatedRecipients.length;

    // Legacy / Old funds
    const oldFundsRes = await db.query(`
      SELECT of.project_id::text as id, of.project_name as name
      FROM old_funds of
      ORDER BY of.project_name ASC
    `);

    // Regular funds
    const fundsRes = await db.query(`
      SELECT f.id::text as id, f.name
      FROM funds f
      ORDER BY f.name ASC
    `);

    const list: Array<{ id: string; name: string; recipientCount: number; defaultSubject: string; isLegacy?: boolean }> = [
      {
        id: 'all-funds',
        name: 'All Active Funds (Consolidated)',
        recipientCount: totalConsolidated,
        defaultSubject: 'Ovalia Capital - General Investor Newsletter',
      },
    ];

    for (const f of oldFundsRes.rows) {
      const c = countMap.get(String(f.id)) || 0;
      list.push({
        id: `old-${f.id}`,
        name: f.name,
        recipientCount: c,
        defaultSubject: `Ovalia Capital ${f.name} Updates`,
        isLegacy: true,
      });
    }

    for (const f of fundsRes.rows) {
      const c = countMap.get(String(f.id)) || 0;
      list.push({
        id: f.id,
        name: f.name,
        recipientCount: c,
        defaultSubject: `Ovalia Capital ${f.name} Updates`,
      });
    }

    return list;
  }

  /**
   * Retrieves active holding recipients (email, name, userId) using the exact Fund Holdings engine
   * from fund transfers (SUM(units) > 0 after reconciling investments, old investments, redemptions, and transfers).
   * Robustly extracts investor names from old_investors and old_investments when not yet in modern users table.
   */
  async getFundRecipients(fundId: string): Promise<Array<{ email: string; name?: string; fullName?: string; userId?: string; totalUnits?: number; accountType?: string }>> {
    const isAll = !fundId || fundId === 'all-funds';
    const cleanFundId = (fundId || '').replace(/^old-/, '');

    let rows: any[] = [];
    if (isAll) {
      const res = await db.query(`
        WITH combined_investments AS (
          SELECT 
            i.user_id::text as user_id,
            u.email as email,
            u.full_name as name,
            COALESCE(i.account_type, 'personal') as account_type,
            i.estimated_units as units
          FROM investments i
          JOIN investors u ON i.user_id = u.id
          WHERE i.is_reconciled = true

          UNION ALL

          SELECT 
            u.id::text as user_id,
            COALESCE(o_inv.primary_email, oi.email_address) as email,
            COALESCE(u.full_name, o_inv.legal_name, oi.investor_profile_legal_name, 'Legacy Investor') as name,
            'ims-' || COALESCE(o_inv.profile_type, 'Individual') || ' account' as account_type,
            (CAST(NULLIF(regexp_replace(oi.investment_amount::text, '[^0-9.]', '', 'g'), '') AS numeric) / 
             NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), f.unit_price, 1), 0)) as units
          FROM old_investments oi
          LEFT JOIN old_investors o_inv ON oi.investor_profile_id = o_inv.ims_profile_id
          LEFT JOIN investors u ON LOWER(TRIM(u.email)) = LOWER(TRIM(COALESCE(o_inv.primary_email, oi.email_address)))
          LEFT JOIN funds f ON oi.project_name = f.name
          WHERE oi.investment_amount IS NOT NULL

          UNION ALL

          SELECT 
            r.investor_id::text as user_id,
            u.email as email,
            u.full_name as name,
            COALESCE(i.account_type, 'personal') as account_type,
            (-1 * r.units) as units
          FROM redemptions r
          JOIN investments i ON r.investment_id = i.id
          JOIN investors u ON r.investor_id = u.id
          WHERE r.status = 'Processed'

          UNION ALL

          SELECT 
            ft.from_investor_id::text as user_id,
            u.email as email,
            u.full_name as name,
            ft.from_account_type as account_type,
            CASE
              WHEN ft.from_account_type ILIKE 'ims-%' THEN 
                (-1 * ft.investment_amount) / NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), ff.unit_price, 1), 0)
              ELSE 
                (-1 * ft.units)
            END as units
          FROM fund_transfers ft
          JOIN investors u ON ft.from_investor_id = u.id
          LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
          WHERE ft.status = 'COMPLETED'

          UNION ALL

          SELECT 
            COALESCE(ft.to_investor_id, ft.from_investor_id)::text as user_id,
            u.email as email,
            u.full_name as name,
            COALESCE(ft.to_account_type, ft.from_account_type) as account_type,
            CASE
              WHEN COALESCE(ft.to_account_type, ft.from_account_type) ILIKE 'ims-%' THEN 
                ft.investment_amount / NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), tf.unit_price, ff.unit_price, 1), 0)
              ELSE 
                ft.units
            END as units
          FROM fund_transfers ft
          JOIN investors u ON COALESCE(ft.to_investor_id, ft.from_investor_id) = u.id
          LEFT JOIN funds tf ON ft.to_fund_id = tf.id::text
          LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
          WHERE ft.status = 'COMPLETED'
        )
        SELECT 
          MAX(c.user_id) as "userId",
          MAX(c.account_type) as account_type,
          COALESCE(MAX(NULLIF(TRIM(c.name), '')), 'Investor') as name,
          LOWER(TRIM(c.email)) as email,
          SUM(c.units) as total_units
        FROM combined_investments c
        WHERE c.units IS NOT NULL AND c.email IS NOT NULL AND TRIM(c.email) != ''
        GROUP BY LOWER(TRIM(c.email))
        HAVING SUM(c.units) > 0
        ORDER BY name ASC
      `);
      rows = res.rows;
    } else {
      const res = await db.query(`
        WITH combined_investments AS (
          SELECT 
            i.user_id::text as user_id,
            u.email as email,
            u.full_name as name,
            COALESCE(i.account_type, 'personal') as account_type,
            i.estimated_units as units
          FROM investments i
          JOIN investors u ON i.user_id = u.id
          WHERE (i.fund_id::text = $1 OR i.fund_id::text = $2) AND i.is_reconciled = true

          UNION ALL

          SELECT 
            u.id::text as user_id,
            COALESCE(o_inv.primary_email, oi.email_address) as email,
            COALESCE(u.full_name, o_inv.legal_name, oi.investor_profile_legal_name, 'Legacy Investor') as name,
            'ims-' || COALESCE(o_inv.profile_type, 'Individual') || ' account' as account_type,
            (CAST(NULLIF(regexp_replace(oi.investment_amount::text, '[^0-9.]', '', 'g'), '') AS numeric) / 
             NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), f.unit_price, 1), 0)) as units
          FROM old_investments oi
          LEFT JOIN old_investors o_inv ON oi.investor_profile_id = o_inv.ims_profile_id
          LEFT JOIN investors u ON LOWER(TRIM(u.email)) = LOWER(TRIM(COALESCE(o_inv.primary_email, oi.email_address)))
          LEFT JOIN funds f ON oi.project_name = f.name
          WHERE (f.id::text = $1 OR oi.project_id::text = $1 OR f.id::text = $2 OR oi.project_id::text = $2)

          UNION ALL

          SELECT 
            r.investor_id::text as user_id,
            u.email as email,
            u.full_name as name,
            COALESCE(i.account_type, 'personal') as account_type,
            (-1 * r.units) as units
          FROM redemptions r
          JOIN investments i ON r.investment_id = i.id
          JOIN investors u ON r.investor_id = u.id
          WHERE (i.fund_id::text = $1 OR i.fund_id::text = $2) AND r.status = 'Processed'

          UNION ALL

          SELECT 
            ft.from_investor_id::text as user_id,
            u.email as email,
            u.full_name as name,
            ft.from_account_type as account_type,
            CASE
              WHEN ft.from_account_type ILIKE 'ims-%' THEN 
                (-1 * ft.investment_amount) / NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), ff.unit_price, 1), 0)
              ELSE 
                (-1 * ft.units)
            END as units
          FROM fund_transfers ft
          JOIN investors u ON ft.from_investor_id = u.id
          LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
          WHERE (ft.from_fund_id = $1 OR ft.from_fund_id = $2) AND ft.status = 'COMPLETED'

          UNION ALL

          SELECT 
            COALESCE(ft.to_investor_id, ft.from_investor_id)::text as user_id,
            u.email as email,
            u.full_name as name,
            COALESCE(ft.to_account_type, ft.from_account_type) as account_type,
            CASE
              WHEN COALESCE(ft.to_account_type, ft.from_account_type) ILIKE 'ims-%' THEN 
                ft.investment_amount / NULLIF(COALESCE((SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), tf.unit_price, ff.unit_price, 1), 0)
              ELSE 
                ft.units
            END as units
          FROM fund_transfers ft
          JOIN investors u ON COALESCE(ft.to_investor_id, ft.from_investor_id) = u.id
          LEFT JOIN funds tf ON ft.to_fund_id = tf.id::text
          LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
          WHERE (COALESCE(ft.to_fund_id, ft.from_fund_id) = $1 OR COALESCE(ft.to_fund_id, ft.from_fund_id) = $2) AND ft.status = 'COMPLETED'
        )
        SELECT 
          MAX(c.user_id) as "userId",
          MAX(c.account_type) as account_type,
          COALESCE(MAX(NULLIF(TRIM(c.name), '')), 'Investor') as name,
          LOWER(TRIM(c.email)) as email,
          SUM(c.units) as total_units
        FROM combined_investments c
        WHERE c.units IS NOT NULL AND c.email IS NOT NULL AND TRIM(c.email) != ''
        GROUP BY LOWER(TRIM(c.email))
        HAVING SUM(c.units) > 0
        ORDER BY name ASC
      `, [fundId, cleanFundId]);
      rows = res.rows;
    }

    // Deduplicate by lowercase trimmed email
    const unique = new Map<string, { email: string; name?: string; fullName?: string; userId?: string; totalUnits?: number; accountType?: string }>();
    for (const r of rows) {
      if (r.email && !unique.has(r.email)) {
        unique.set(r.email, {
          email: r.email,
          name: r.name || undefined,
          fullName: r.name || undefined,
          userId: r.userId ? String(r.userId) : undefined,
          totalUnits: parseFloat(r.total_units || '0'),
          accountType: r.account_type || 'Holding',
        });
      }
    }

    return Array.from(unique.values());
  }

  async getCampaigns(params?: { status?: string; search?: string }) {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params?.status && params.status !== 'All') {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }

    if (params?.search && params.search.trim()) {
      conditions.push(`(subject ILIKE $${idx} OR fund_name ILIKE $${idx} OR body ILIKE $${idx})`);
      values.push(`%${params.search.trim()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await db.query(`
      SELECT 
        id, subject, preheader, from_name as "fromName", from_email as "fromEmail",
        fund_id as "fundId", fund_name as "fundName", recipient_count as "recipientCount",
        body, status, scheduled_at as "scheduledAt", sent_at as "sentAt", failed_reason as "failedReason",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM email_campaigns
      ${whereClause}
      ORDER BY updated_at DESC
    `, values);

    return res.rows;
  }

  async getCampaignById(id: string) {
    const res = await db.query(`
      SELECT 
        id, subject, preheader, from_name as "fromName", from_email as "fromEmail",
        fund_id as "fundId", fund_name as "fundName", recipient_count as "recipientCount",
        body, status, scheduled_at as "scheduledAt", sent_at as "sentAt", failed_reason as "failedReason",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM email_campaigns
      WHERE id = $1
    `, [id]);

    if (res.rows.length === 0) {
      throw new NotFoundException(`Email campaign ${id} not found`);
    }

    return res.rows[0];
  }

  async createCampaign(data: {
    subject: string;
    preheader?: string;
    fromName?: string;
    fromEmail?: string;
    fundId: string;
    fundName: string;
    recipientCount?: number;
    body: string;
    status?: string;
    scheduledAt?: string | null;
  }, userId?: string) {
    let count = data.recipientCount;
    if (count === undefined || count === null) {
      const recs = await this.getFundRecipients(data.fundId);
      count = recs.length;
    }

    const res = await db.query(`
      INSERT INTO email_campaigns (
        subject,
        preheader,
        from_name,
        from_email,
        fund_id,
        fund_name,
        recipient_count,
        body,
        status,
        scheduled_at,
        created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id, subject, preheader, from_name as "fromName", from_email as "fromEmail",
        fund_id as "fundId", fund_name as "fundName", recipient_count as "recipientCount",
        body, status, scheduled_at as "scheduledAt", sent_at as "sentAt", failed_reason as "failedReason",
        created_at as "createdAt", updated_at as "updatedAt"
    `, [
      data.subject,
      data.preheader || null,
      data.fromName || 'Ovalia Capital',
      data.fromEmail || 'invest@ovaliacapital.com',
      data.fundId,
      data.fundName,
      count || 0,
      data.body,
      data.status || 'Draft',
      data.scheduledAt ? new Date(data.scheduledAt) : null,
      userId || null,
    ]);

    return res.rows[0];
  }

  async updateCampaign(id: string, data: Partial<{
    subject: string;
    preheader: string;
    fromName: string;
    fromEmail: string;
    fundId: string;
    fundName: string;
    recipientCount: number;
    body: string;
    status: string;
    scheduledAt: string | null;
  }>) {
    const existing = await this.getCampaignById(id);
    if (!existing) {
      throw new NotFoundException(`Email campaign ${id} not found`);
    }

    if (existing.status === 'Sent') {
      throw new BadRequestException('Sent email campaigns cannot be modified.');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.subject !== undefined) { fields.push(`subject = $${idx++}`); values.push(data.subject); }
    if (data.preheader !== undefined) { fields.push(`preheader = $${idx++}`); values.push(data.preheader); }
    if (data.fromName !== undefined) { fields.push(`from_name = $${idx++}`); values.push(data.fromName); }
    if (data.fromEmail !== undefined) { fields.push(`from_email = $${idx++}`); values.push(data.fromEmail); }
    if (data.fundId !== undefined) { fields.push(`fund_id = $${idx++}`); values.push(data.fundId); }
    if (data.fundName !== undefined) { fields.push(`fund_name = $${idx++}`); values.push(data.fundName); }
    if (data.recipientCount !== undefined) { fields.push(`recipient_count = $${idx++}`); values.push(data.recipientCount); }
    if (data.body !== undefined) { fields.push(`body = $${idx++}`); values.push(data.body); }
    if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
    if (data.scheduledAt !== undefined) {
      fields.push(`scheduled_at = $${idx++}`);
      values.push(data.scheduledAt ? new Date(data.scheduledAt) : null);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await db.query(`
      UPDATE email_campaigns
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING 
        id, subject, preheader, from_name as "fromName", from_email as "fromEmail",
        fund_id as "fundId", fund_name as "fundName", recipient_count as "recipientCount",
        body, status, scheduled_at as "scheduledAt", sent_at as "sentAt", failed_reason as "failedReason",
        created_at as "createdAt", updated_at as "updatedAt"
    `, values);

    return res.rows[0];
  }

  async deleteCampaign(id: string) {
    const res = await db.query(`DELETE FROM email_campaigns WHERE id = $1 RETURNING id`, [id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Email campaign ${id} not found`);
    }
    return { success: true, id };
  }

  getCampaignLetterheadHtml(body: string, fundName: string, title: string, preheader?: string): string {
    const formattedBody = body
      .split(/\r?\n/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '<div style="height: 12px;"></div>';
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          return `<div style="margin: 4px 0 4px 16px; font-size: 15px; line-height: 1.6; color: #374151;">${trimmed}</div>`;
        }
        return `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.65; color: #374151;">${trimmed}</p>`;
      })
      .join('');

    const preheaderSnippet = preheader ? `
      <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
        ${preheader}
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        ${preheaderSnippet}
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 30px auto; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.06); border: 1px solid #E5E7EB;">
          <tr>
            <td style="background-color: #1E3A8A; height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 32px 40px 18px; text-align: center;" align="center">
              <img src="${this.getPublicLogoUrl()}" width="84" border="0" alt="Ovalia Capital" style="width: 84px; max-width: 84px; height: auto; display: block; margin: 0 auto; outline: none;">
              <h1 style="margin: 12px 0 2px; font-family: 'Garamond', Georgia, serif; font-size: 20px; font-weight: 700; color: #1E3A8A; letter-spacing: 1.5px; text-transform: uppercase;">
                Ovalia Capital
              </h1>
              <p style="margin: 0; font-size: 10px; letter-spacing: 2.5px; color: #9CA3AF; text-transform: uppercase; font-weight: 600;">
                Fiduciary Real Estate Investments
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 1px solid #F3F4F6; width: 100%;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 40px 36px; font-size: 15px; line-height: 1.65; color: #374151;">
              ${body.includes('<p') || body.includes('<div') ? body : formattedBody}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #F3F4F6; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; font-weight: 500;">
                &copy; ${new Date().getFullYear()} Ovalia Capital Management. All rights reserved.
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #BEC3CC;">
                Sent to active investors in <strong style="color: #6B7280;">${fundName}</strong>.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendCampaign(id: string, triggeredByUserId?: string) {
    const campRes = await db.query(`SELECT * FROM email_campaigns WHERE id = $1`, [id]);
    if (campRes.rows.length === 0) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    const camp = campRes.rows[0];

    if (camp.status === 'Sent') {
      throw new BadRequestException('This email campaign has already been sent.');
    }

    const recipients = await this.getFundRecipients(camp.fund_id);
    if (!recipients || recipients.length === 0) {
      await db.query(`
        UPDATE email_campaigns
        SET status = 'Failed', failed_reason = 'No eligible recipients found for this fund', updated_at = NOW()
        WHERE id = $1
      `, [id]);
      throw new BadRequestException('No eligible recipients found for selected fund');
    }

    const htmlContent = this.getCampaignLetterheadHtml(camp.body, camp.fund_name, camp.subject, camp.preheader);

    let sentCount = 0;
    let failedCount = 0;
    let lastError: string | null = null;

    for (const r of recipients) {
      if (!r.email) continue;
      try {
        await this.sendEmail(r.email, camp.subject, htmlContent, {
          notificationType: 'EMAIL_UPDATE_CAMPAIGN',
          fromName: camp.from_name,
          templateName: 'email_update_letterhead',
          recipientName: r.name,
          recipientUserId: r.userId,
          triggeredByUserId,
          relatedEntityType: 'EMAIL_CAMPAIGN',
          relatedEntityId: String(camp.id),
          metadata: {
            fundId: camp.fund_id,
            fundName: camp.fund_name,
            preheader: camp.preheader,
          },
        });
        sentCount++;
      } catch (err: any) {
        failedCount++;
        lastError = err.message || 'SMTP delivery error';
        this.logger.error(`Failed to send campaign email to ${r.email}: ${lastError}`);
      }
    }

    const finalStatus = sentCount > 0 ? 'Sent' : 'Failed';
    const failedReason = sentCount > 0 ? (failedCount > 0 ? `${failedCount} recipient(s) failed` : null) : lastError;

    await db.query(`
      UPDATE email_campaigns
      SET status = $1,
          sent_at = NOW(),
          recipient_count = $2,
          failed_reason = $3,
          updated_at = NOW()
      WHERE id = $4
    `, [finalStatus, sentCount, failedReason, id]);

    return {
      success: finalStatus === 'Sent',
      status: finalStatus,
      sentCount,
      failedCount,
      recipientCount: recipients.length,
      failedReason,
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledEmailCampaignsCron() {
    try {
      const pendingRes = await db.query(`
        SELECT id, subject, fund_name FROM email_campaigns
        WHERE status = 'Scheduled' 
          AND scheduled_at IS NOT NULL 
          AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 5
      `);

      if (pendingRes.rows.length === 0) return;

      this.logger.log(`⏰ Found ${pendingRes.rows.length} scheduled email campaign(s) ready to send`);

      for (const camp of pendingRes.rows) {
        this.logger.log(`🚀 Dispatching scheduled campaign: "${camp.subject}" for fund "${camp.fund_name}" (ID: ${camp.id})`);
        try {
          await this.sendCampaign(camp.id);
        } catch (err: any) {
          this.logger.error(`❌ Scheduled campaign ${camp.id} failed: ${err.message}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in handleScheduledEmailCampaignsCron: ${err.message}`);
    }
  }
}
