import { AuthService } from './auth.service';
export declare class SignupDto {
    email: string | undefined;
    password: string | undefined;
    firstName: string | undefined;
    lastName: string | undefined;
    dob?: string;
    phone?: string;
    role?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    taxId?: string;
}
export declare class LoginDto {
    email: string | undefined;
    password: string | undefined;
    role?: string;
}
export declare class ForgotPasswordDto {
    email: string | undefined;
    role?: string;
}
export declare class VerifyOtpDto {
    email: string | undefined;
    otp: string | undefined;
}
export declare class ResetPasswordDto {
    email: string | undefined;
    otp: string | undefined;
    password: string | undefined;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(signupDto: SignupDto): Promise<{
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
    investorSignup(signupDto: SignupDto): Promise<{
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
    login(loginDto: LoginDto): Promise<{
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
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map