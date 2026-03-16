import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
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
        };
        token: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map