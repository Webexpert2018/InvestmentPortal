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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const database_1 = require("../../config/database");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    constructor(jwtService, emailService) {
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async signup(email, password, firstName, lastName, phone, dob, role, addressLine1, addressLine2, city, state, zipCode, country, taxId) {
        const existingUserResult = await database_1.db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const userResult = await database_1.db.query(`INSERT INTO users (email, password_hash, first_name, last_name, phone, dob, role, status, address_line1, address_line2, city, state, zip_code, country, tax_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, email, role, first_name, last_name, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, profile_image_url`, [email, passwordHash, firstName, lastName, phone, dob, role || 'investor', 'active', addressLine1, addressLine2, city, state, zipCode, country, taxId]);
        const newUser = userResult.rows[0];
        // await db.query(
        //   `INSERT INTO portfolios (user_id, bitcoin_balance, nav, performance, total_invested, total_withdrawn)
        //    VALUES ($1, $2, $3, $4, $5, $6)`,
        //   [newUser.id, 0, 0, 0, 0, 0]
        // );
        const token = this.jwtService.sign({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role
        });
        // Send welcome email asynchronously
        this.emailService.sendWelcomeEmail(newUser.email, newUser.first_name, newUser.role || 'investor', password)
            .catch(err => console.error(`Failed to send welcome email to ${newUser.email}:`, err));
        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                phone: newUser.phone,
                dob: newUser.dob,
                status: newUser.status,
                addressLine1: newUser.address_line1,
                addressLine2: newUser.address_line2,
                city: newUser.city,
                state: newUser.state,
                zipCode: newUser.zip_code,
                country: newUser.country,
                taxId: newUser.tax_id,
                profileImageUrl: newUser.profile_image_url,
            },
            token,
        };
    }
    async login(email, password, role) {
        try {
            const result = await database_1.db.query('SELECT id, email, password_hash, role, first_name, last_name, status, phone, dob, address_line1, address_line2, city, state, zip_code, country, tax_id, profile_image_url FROM users WHERE email = $1', [email]);
            const user = result.rows[0];
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            if (user.status !== 'active') {
                throw new common_1.UnauthorizedException('Account is not active');
            }
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            // Role-based access control check
            if (role && user.role !== role) {
                throw new common_1.UnauthorizedException(`Access denied. You do not have the ${role} role.`);
            }
            const token = this.jwtService.sign({
                userId: user.id,
                email: user.email,
                role: user.role
            });
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone,
                    dob: user.dob,
                    status: user.status,
                    addressLine1: user.address_line1,
                    addressLine2: user.address_line2,
                    city: user.city,
                    state: user.state,
                    zipCode: user.zip_code,
                    country: user.country,
                    taxId: user.tax_id,
                    profileImageUrl: user.profile_image_url,
                },
                token,
            };
        }
        catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    async forgotPassword(email, role) {
        const userResult = await database_1.db.query('SELECT id, role FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            throw new common_1.BadRequestException('Email not registered');
        }
        const user = userResult.rows[0];
        if (role && user.role !== role) {
            throw new common_1.BadRequestException('Email not registered for this role');
        }
        const userId = user.id;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        // Store in the new user_otps table
        await database_1.db.query('INSERT INTO user_otps (user_id, otp, type, expires_at) VALUES ($1, $2, $3, $4)', [userId, otp, 'FORGOT_PASSWORD', expiresAt]);
        // Also update the users table for backward compatibility (optional but keeping for now)
        await database_1.db.query('UPDATE users SET reset_otp = $1, reset_otp_expires_at = $2 WHERE id = $3', [otp, expiresAt, userId]);
        await this.emailService.sendPasswordResetOtp(email, otp);
        return { message: 'Reset code sent successfully' };
    }
    async verifyOtp(email, otp) {
        const userResult = await database_1.db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            throw new common_1.UnauthorizedException('Invalid email or reset code');
        }
        const userId = userResult.rows[0].id;
        const otpResult = await database_1.db.query('SELECT id FROM user_otps WHERE user_id = $1 AND otp = $2 AND type = $3 AND expires_at > NOW() AND is_used = false', [userId, otp, 'FORGOT_PASSWORD']);
        if (otpResult.rows.length === 0) {
            throw new common_1.UnauthorizedException('Invalid or expired reset code');
        }
        return { message: 'Code verified successfully' };
    }
    async resetPassword(email, otp, password) {
        const userResult = await database_1.db.query('SELECT id, first_name FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            throw new common_1.UnauthorizedException('Invalid email or reset code');
        }
        const userId = userResult.rows[0].id;
        // Check OTP in user_otps
        const otpResult = await database_1.db.query('SELECT id FROM user_otps WHERE user_id = $1 AND otp = $2 AND type = $3 AND expires_at > NOW() AND is_used = false', [userId, otp, 'FORGOT_PASSWORD']);
        if (otpResult.rows.length === 0) {
            throw new common_1.UnauthorizedException('Invalid or expired reset code');
        }
        const otpId = otpResult.rows[0].id;
        const passwordHash = await bcrypt.hash(password, 10);
        // Start a transaction would be better, but using simple queries for now
        await database_1.db.query('UPDATE users SET password_hash = $1, reset_otp = NULL, reset_otp_expires_at = NULL WHERE id = $2', [passwordHash, userId]);
        // Mark OTP as used
        await database_1.db.query('UPDATE user_otps SET is_used = true WHERE id = $1', [otpId]);
        // Send password changed notification
        this.emailService.sendPasswordChangedEmail(email, userResult.rows[0].first_name || 'User', password)
            .catch(err => console.error(`Failed to send password changed email to ${email}:`, err));
        return { message: 'Password reset successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map