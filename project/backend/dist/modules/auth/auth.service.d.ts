import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    signup(email: string, password: string, firstName: string, lastName: string, phone?: string): Promise<{
        user: {
            id: any;
            email: any;
            role: any;
            firstName: any;
            lastName: any;
        };
        token: string;
    }>;
    login(email: string, password: string): Promise<{
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
//# sourceMappingURL=auth.service.d.ts.map