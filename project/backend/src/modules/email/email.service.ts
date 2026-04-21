import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMTPClient } from 'smtp-client';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) { }

  async sendPasswordResetOtp(email: string, otp: string, showCode: boolean = true) {
    const title = 'Verify Your Identity';
    const subject = 'Password Reset Code - Bitcoin IRA Platform';
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
        <a href="https://investmentportalfrontend.vercel.app/auth/forgot-password?email=${email}&otp=${otp}&flow=investor" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          Reset Password
        </a>
      </div>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title));
  }

  async sendWelcomeEmail(email: string, firstName: string, role: string, password?: string) {
    const title = 'Welcome to Ovalia Capital';
    const subject = 'Your Journey Begins - Welcome to Bitcoin IRA Platform!';
    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Welcome Aboard, ${firstName}!</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        We are thrilled to have you join the <strong>Bitcoin IRA Platform</strong> as an ${role.charAt(0).toUpperCase() + role.slice(1)}.
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
          ${password ? `
          <tr>
            <td style="padding: 5px 0; color: #6B7280; font-size: 14px;"><strong>Password:</strong></td>
            <td style="padding: 5px 0; color: #1F1F1F; font-size: 14px;"><code>${password}</code></td>
          </tr>
          ` : ''}
        </table>
      </div>

      <h3 style="margin: 0 0 15px; font-size: 18px; color: #1F1F1F;">What's Next?</h3>
      <ul style="padding: 0; margin: 0 0 30px 20px; color: #4B5563; font-size: 15px; line-height: 1.8;">
        <li><strong>Complete Your Profile:</strong> Head to settings to ensure all your information is up to date.</li>
        <li><strong>Secure Your Account:</strong> We highly recommend enabling Two-Factor Authentication (2FA) in your security settings.</li>
        <li><strong>Explore the Dashboard:</strong> View your portfolio, track performance, and manage your digital assets.</li>
      </ul>

      <div style="background-color: #FFF5F5; border-left: 4px solid #E53E3E; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 13px; color: #9B2C2C; line-height: 1.5;">
          <strong>SECURITY ALERT:</strong> For your protection, please do not share these details with anyone. We recommend changing your password immediately after your first login and deleting this email.
        </p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="https://investmentportalfrontend.vercel.app/auth/login?flow=${role.toLowerCase()}" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          Go to Dashboard
        </a>
      </div>

      <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 20px;">
        Need help? Contact our support team at <a href="mailto:support@ovaliacapital.com" style="color: #2A4474; text-decoration: none;">support@ovaliacapital.com</a>
      </p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title));
  }

  async sendPasswordChangedEmail(email: string, firstName: string, password?: string) {
    const title = 'Security Update';
    const subject = 'Password Successfully Updated - Bitcoin IRA Platform';
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
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title));
  }

  async sendStaffWelcomeEmail(email: string, fullName: string, role: string, password: string) {
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

    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Welcome to the Team, ${fullName}!</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        We are excited to inform you that you have been added as a <strong>${roleName}</strong> on the <strong>Bitcoin IRA Platform</strong>.
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
        <a href="https://investmentportalfrontend.vercel.app/auth/login?flow=${flow}" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          ${buttonText}
        </a>
      </div>

      <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 20px;">
        Need assistance? Please contact your system administrator or reach out to support at <a href="mailto:support@ovaliacapital.com" style="color: #2A4474; text-decoration: none;">support@ovaliacapital.com</a>
      </p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title));
  }

  async sendInvestorInvitationEmail(email: string, fullName: string, token: string) {
    const title = 'Invitation to Bitcoin IRA';
    const subject = 'You have been invited to join the Bitcoin IRA Platform';
    const inviteLink = `https://investmentportalfrontend.vercel.app/auth/investor-signup?invite=${token}`;

    const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Exclusive Invitation</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        Hello ${fullName || 'Valued Investor'},
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        You have been personally invited to join the <strong>Bitcoin IRA Platform</strong>. Our platform provides you with a secure and streamlined way to manage your digital asset investments.
      </p>
      
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        To get started and set up your account, please follow the link below. Your registration data has already been prepared for you.
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${inviteLink}" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(251, 203, 75, 0.3); display: inline-block; transition: all 0.3s ease;">
          Complete Your Registration
        </a>
      </div>

      <div style="background-color: #F9FAFB; border-left: 4px solid #FBCB4B; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5;">
          <strong>Security Note:</strong> This invitation link is unique to you and should not be shared. If you have any questions, please reach out to our investor relations team.
        </p>
      </div>

      <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9CA3AF; text-align: center; border-top: 1px solid #F3F4F6; padding-top: 20px;">
        Need help? Contact our support team at <a href="mailto:support@ovaliacapital.com" style="color: #2A4474; text-decoration: none;">support@ovaliacapital.com</a>
      </p>
    `;
    await this.sendEmail(email, subject, this.getHtmlTemplate(content, title));
  }

  private getHtmlTemplate(content: string, title: string) {
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
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="color: #2A4474; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
                <span style="color: #FBCB4B;">Ovalia</span> Capital
              </div>
              <div style="color: #9CA3AF; font-size: 10px; letter-spacing: 3px; margin-top: 5px; text-transform: uppercase;">Bitcoin IRA Platform</div>
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

  private async sendEmail(to: string, subject: string, html: string) {
    const host = this.configService.get<string>('SMTP_HOST') || this.configService.get<string>('EMAIL_HOST');
    const portString = this.configService.get<string>('SMTP_PORT') || this.configService.get<string>('EMAIL_PORT');
    const port = portString ? parseInt(portString, 10) : 587;
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('EMAIL_PASS');
    const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('EMAIL_FROM') || '"Bitcoin IRA Platform" <noreply@bitcoinira.com>';

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

        const extractEmail = (str: string) => {
          const match = str.match(/<(.+)>/);
          return match ? match[1] : str.trim();
        };

        const rawFrom = extractEmail(from);
        const rawTo = extractEmail(to);

        await client.mail({ from: rawFrom });
        await client.rcpt({ to: rawTo });

        const message = `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${html}`;

        await client.data(message);
        await client.quit();

        this.logger.log(`✅ Email sent to ${to}: ${subject}`);
      } catch (error: any) {
        this.logger.error(`❌ SMTP Error sending to ${to}: ${error.message}`, error.stack);
        throw new Error(`Could not send email to ${to}`);
      }
    } else {
      this.logger.warn('⚠️ Email service configuration missing. Running in dummy mode.');
      this.this_is_dummy_log(to, subject);
    }
  }

  private this_is_dummy_log(to: string, subject: string) {
    this.logger.log('--- DUMMY EMAIL LOG ---');
    this.logger.log(`To: ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log('-----------------------');
  }
}
