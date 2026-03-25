import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private jwtService;
    private emailService;
    constructor(jwtService: JwtService, emailService: EmailService);
    signup(email: string, password: string, firstName: string, lastName: string, phone?: string, dob?: string, role?: string, addressLine1?: string, addressLine2?: string, city?: string, state?: string, zipCode?: string, country?: string, taxId?: string): Promise<{
        user: {
            id: any;
            email: any;
            role: any;
            firstName: any;
            lastName: any;
            phone: any;
            dob: any;
            status: any;
            addressLine1: any;
            addressLine2: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
            taxId: any;
            profileImageUrl: any;
        };
        token: string;
    }>;
    login(email: string, password: string, role?: string): Promise<{
        user: {
            id: any;
            email: any;
            role: any;
            firstName: any;
            lastName: any;
            phone: any;
            dob: any;
            status: any;
            addressLine1: any;
            addressLine2: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
            taxId: any;
            profileImageUrl: any;
        };
        token: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    verifyOtp(email: string, otp: string): Promise<{
        message: string;
    }>;
    resetPassword(email: string, otp: string, password: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map