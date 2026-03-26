import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendPasswordResetOtp(email: string, otp: string): Promise<void>;
    sendWelcomeEmail(email: string, firstName: string, role: string, password?: string): Promise<void>;
    sendPasswordChangedEmail(email: string, firstName: string, password?: string): Promise<void>;
    private getHtmlTemplate;
    private sendEmail;
    private this_is_dummy_log;
}
//# sourceMappingURL=email.service.d.ts.map