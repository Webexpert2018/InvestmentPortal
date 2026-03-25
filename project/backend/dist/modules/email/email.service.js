"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const smtp_client_1 = require("smtp-client");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async sendPasswordResetOtp(email, otp) {
        const title = 'Verify Your Identity';
        const subject = 'Password Reset Code - Bitcoin IRA Platform';
        const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Password Reset</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">You have requested to reset your password. Please use the verification code below to proceed.</p>
      <div style="background-color: #FFFBEB; border: 2px dashed #FBCB4B; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #1F1F1F; letter-spacing: 8px; font-family: monospace;">${otp}</span>
      </div>
      <p style="margin: 20px 0 0; font-size: 14px; color: #6B7280; font-style: italic;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
    `;
        await this.sendEmail(email, subject, this.getHtmlTemplate(content, title));
    }
    async sendWelcomeEmail(email, firstName, role) {
        const title = 'Welcome to Ovalia Capital';
        const subject = 'Your Journey Begins - Welcome to Bitcoin IRA Platform!';
        const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Welcome Aboard, ${firstName}!</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        We are thrilled to have you join the <strong>Bitcoin IRA Platform</strong> as an ${role.charAt(0).toUpperCase() + role.slice(1)}.
      </p>
      <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        Ovalia Capital provides you with the ultimate security and flexibility for your digital asset investments. Your account is now active and ready for use.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3000/auth/login" style="background: linear-gradient(135deg, #FBCB4B 0%, #E2B93B 100%); color: #1F1F1F; padding: 14px 35px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block;">
          Go to Dashboard
        </a>
      </div>
    `;
        await this.sendEmail(email, subject, this.getHtmlTemplate(content, title));
    }
    async sendPasswordChangedEmail(email, firstName) {
        const title = 'Security Update';
        const subject = 'Password Successfully Updated - Bitcoin IRA Platform';
        const content = `
      <h1 style="margin: 0 0 20px; font-family: 'Garamond', serif; color: #1F1F1F; font-size: 28px;">Password Updated</h1>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">Hello ${firstName},</p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4B5563;">
        Your password has been successfully updated. This is a security confirmation to ensure you made this change.
      </p>
      <div style="background-color: #F3F4F6; border-left: 4px solid #FBCB4B; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #374151;">
          <strong>Security Note:</strong> If you did not authorize this change, please contact our support team immediately to secure your account.
        </p>
      </div>
    `;
        await this.sendEmail(email, subject, this.getHtmlTemplate(content, title));
    }
    getHtmlTemplate(content, title) {
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
    async sendEmail(to, subject, html) {
        const host = this.configService.get('SMTP_HOST') || this.configService.get('EMAIL_HOST');
        const portString = this.configService.get('SMTP_PORT') || this.configService.get('EMAIL_PORT');
        const port = portString ? parseInt(portString, 10) : 587;
        const user = this.configService.get('SMTP_USER') || this.configService.get('EMAIL_USER');
        const pass = this.configService.get('SMTP_PASS') || this.configService.get('EMAIL_PASS');
        const from = this.configService.get('SMTP_FROM') || this.configService.get('EMAIL_FROM') || '"Bitcoin IRA Platform" <noreply@bitcoinira.com>';
        if (host && port && user && pass) {
            const client = new smtp_client_1.SMTPClient({ host, port });
            try {
                await client.connect();
                await client.greet({ hostname: host });
                if (port === 587) {
                    await client.secure();
                    await client.greet({ hostname: host });
                }
                await client.authPlain({ username: user, password: pass });
                const extractEmail = (str) => {
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
            }
            catch (error) {
                this.logger.error(`❌ SMTP Error sending to ${to}: ${error.message}`, error.stack);
                throw new Error(`Could not send email to ${to}`);
            }
        }
        else {
            this.logger.warn('⚠️ Email service configuration missing. Running in dummy mode.');
            this.this_is_dummy_log(to, subject);
        }
    }
    this_is_dummy_log(to, subject) {
        this.logger.log('--- DUMMY EMAIL LOG ---');
        this.logger.log(`To: ${to}`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log('-----------------------');
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map