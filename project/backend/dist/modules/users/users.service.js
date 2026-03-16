"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../config/database");
let UsersService = class UsersService {
    async getProfile(userId) {
        const result = await database_1.db.query('SELECT id, email, role, first_name, last_name, phone, status, created_at, dob, address_line1, address_line2, city, state, zip_code, country, tax_id FROM users WHERE id = $1', [userId]);
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
        };
    }
    async updateProfile(userId, firstName, lastName, phone) {
        const updates = ['updated_at = NOW()'];
        const values = [];
        let paramIndex = 1;
        if (firstName) {
            updates.push(`first_name = $${paramIndex++}`);
            values.push(firstName);
        }
        if (lastName) {
            updates.push(`last_name = $${paramIndex++}`);
            values.push(lastName);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }
        values.push(userId);
        const result = await database_1.db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role, first_name, last_name, phone, status, dob, address_line1, address_line2, city, state, zip_code, country, tax_id`, values);
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map