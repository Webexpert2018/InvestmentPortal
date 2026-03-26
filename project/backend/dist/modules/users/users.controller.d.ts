import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
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
    updateProfile(user: any, updateDto: UpdateProfileDto): Promise<{
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
    getSettings(user: any): Promise<{
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
    updateSettings(user: any, updateDto: UpdateProfileDto): Promise<{
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
    changePassword(user: any, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    uploadProfileImage(user: any, file: any): Promise<{
        message: string;
        imageUrl: string;
    }>;
}
//# sourceMappingURL=users.controller.d.ts.map