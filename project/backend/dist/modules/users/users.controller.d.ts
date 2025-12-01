import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
        createdAt: any;
    }>;
    updateProfile(user: any, updateDto: any): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
    }>;
    getAllUsers(user: any): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
        createdAt: any;
    }[]>;
    getUserById(id: string, user: any): Promise<{
        id: any;
        email: any;
        role: any;
        firstName: any;
        lastName: any;
        phone: any;
        status: any;
        createdAt: any;
    }>;
    updateUserStatus(id: string, body: {
        status: string;
    }, user: any): Promise<{
        id: any;
        email: any;
        status: any;
    }>;
}
//# sourceMappingURL=users.controller.d.ts.map