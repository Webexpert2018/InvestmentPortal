export declare class UsersService {
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
        createdAt: any;
    }>;
    updateProfile(userId: string, firstName?: string, lastName?: string, phone?: string): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
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
}
//# sourceMappingURL=users.service.d.ts.map