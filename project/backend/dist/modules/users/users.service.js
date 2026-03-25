"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../config/database");
const bcrypt = __importStar(require("bcrypt"));
const email_service_1 = require("../email/email.service");
let UsersService = class UsersService {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async getProfile(userId) {
        const result = await database_1.db.query('SELECT id, email, role, first_name, last_name, phone, status, created_at, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, profile_image_url FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            status: user.status,
            createdAt: user.created_at,
            dob: user.dob,
            addressLine1: user.address_line1,
            addressLine2: user.address_line2,
            city: user.city,
            state: user.state,
            zipCode: user.zip_code,
            country: user.country,
            taxId: user.tax_id,
            profileImageUrl: user.profile_image_url,
        };
    }
    async updateProfile(userId, firstName, lastName, phone, dob, addressLine1, addressLine2, city, state, zipCode, country, taxId, profileImageUrl) {
        const updates = ['updated_at = NOW()'];
        const values = [];
        let paramIndex = 1;
        if (firstName !== undefined) {
            updates.push(`first_name = $${paramIndex++}`);
            values.push(firstName);
        }
        if (lastName !== undefined) {
            updates.push(`last_name = $${paramIndex++}`);
            values.push(lastName);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }
        if (dob !== undefined) {
            updates.push(`dob = $${paramIndex++}`);
            values.push(dob === '' ? null : dob);
        }
        if (addressLine1 !== undefined) {
            updates.push(`address_line1 = $${paramIndex++}`);
            values.push(addressLine1);
        }
        if (addressLine2 !== undefined) {
            updates.push(`address_line2 = $${paramIndex++}`);
            values.push(addressLine2);
        }
        if (city !== undefined) {
            updates.push(`city = $${paramIndex++}`);
            values.push(city);
        }
        if (state !== undefined) {
            updates.push(`state = $${paramIndex++}`);
            values.push(state);
        }
        if (zipCode !== undefined) {
            updates.push(`zip_code = $${paramIndex++}`);
            values.push(zipCode);
        }
        if (country !== undefined) {
            updates.push(`country = $${paramIndex++}`);
            values.push(country);
        }
        if (taxId !== undefined) {
            updates.push(`tax_id = $${paramIndex++}`);
            values.push(taxId);
        }
        if (profileImageUrl !== undefined) {
            updates.push(`profile_image_url = $${paramIndex++}`);
            values.push(profileImageUrl);
        }
        values.push(userId);
        const result = await database_1.db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role, first_name, last_name, phone, status, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, profile_image_url`, values);
        console.log(`[UsersService] Updated profile for user ${userId}. New profile_image_url: ${result.rows[0].profile_image_url}`);
        const user = result.rows[0];
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            status: user.status,
            dob: user.dob,
            addressLine1: user.address_line1,
            addressLine2: user.address_line2,
            city: user.city,
            state: user.state,
            zipCode: user.zip_code,
            country: user.country,
            taxId: user.tax_id,
            profileImageUrl: user.profile_image_url,
        };
    }
    async getAllUsers(requestingUserRole) {
        if (requestingUserRole !== 'admin') {
            throw new common_1.ForbiddenException('Only admins can view all users');
        }
        const result = await database_1.db.query('SELECT id, email, role, first_name, last_name, phone, status, created_at FROM users ORDER BY created_at DESC');
        return result.rows.map((user) => ({
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            status: user.status,
            createdAt: user.created_at,
        }));
    }
    async getUserById(targetUserId, requestingUserId, requestingUserRole) {
        if (requestingUserRole !== 'admin' && requestingUserId !== targetUserId) {
            throw new common_1.ForbiddenException('You can only view your own profile');
        }
        const result = await database_1.db.query('SELECT id, email, role, first_name, last_name, phone, status, created_at FROM users WHERE id = $1', [targetUserId]);
        const user = result.rows[0];
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            status: user.status,
            createdAt: user.created_at,
        };
    }
    async updateUserStatus(userId, status, requestingUserRole) {
        if (requestingUserRole !== 'admin') {
            throw new common_1.ForbiddenException('Only admins can update user status');
        }
        const result = await database_1.db.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, status', [status, userId]);
        const user = result.rows[0];
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return { id: user.id, email: user.email, status: user.status };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const userResult = await database_1.db.query('SELECT email, first_name, password_hash FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Invalid current password');
        }
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await database_1.db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, userId]);
        // Send password changed notification
        this.emailService.sendPasswordChangedEmail(user.email || '', user.first_name || 'User')
            .catch(err => console.error(`Failed to send password changed email to ${user.email}:`, err));
        return { message: 'Password updated successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], UsersService);
//# sourceMappingURL=users.service.js.map