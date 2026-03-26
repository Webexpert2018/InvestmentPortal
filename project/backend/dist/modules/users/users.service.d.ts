import { EmailService } from '../email/email.service';
export declare class UsersService {
    private emailService;
    constructor(emailService: EmailService);
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
        createdAt: any;
        dob: any;
        addressLine1: any;
        addressLine2: any;
        city: any;
        state: any;
        zipCode: any;
        country: any;
        taxId: any;
        profileImageUrl: any;
    }>;
    updateProfile(userId: string, firstName?: string, lastName?: string, phone?: string, dob?: string, addressLine1?: string, addressLine2?: string, city?: string, state?: string, zipCode?: string, country?: string, taxId?: string, profileImageUrl?: string): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
        dob: any;
        addressLine1: any;
        addressLine2: any;
        city: any;
        state: any;
        zipCode: any;
        country: any;
        taxId: any;
        profileImageUrl: any;
    }>;
    getAllUsers(requestingUserRole: string): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
        createdAt: any;
    }[]>;
    getUserById(targetUserId: string, requestingUserId: string, requestingUserRole: string): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
        createdAt: any;
    }>;
    updateUserStatus(userId: string, status: string, requestingUserRole: string): Promise<{
        id: any;
        email: any;
        status: any;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=users.service.d.ts.map