import { AuthService } from './auth.service';
export declare class SignupDto {
    email: string | undefined;
    password: string | undefined;
    firstName: string | undefined;
    lastName: string | undefined;
    phone?: string;
}
export declare class LoginDto {
    email: string | undefined;
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
        };
        token: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map