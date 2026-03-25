"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = exports.ResetPasswordDto = exports.VerifyOtpDto = exports.ForgotPasswordDto = exports.LoginDto = exports.SignupDto = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SignupDto {
}
exports.SignupDto = SignupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'test@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", Object)
], SignupDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'StrongPassword123!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", Object)
], SignupDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], SignupDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], SignupDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1995-08-15' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "dob", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+15553332211' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "addressLine1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "addressLine2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "zipCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignupDto.prototype, "taxId", void 0);
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'test@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", Object)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'StrongPassword123!' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'investor' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "role", void 0);
class ForgotPasswordDto {
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'test@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", Object)
], ForgotPasswordDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'investor' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "role", void 0);
class VerifyOtpDto {
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'test@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", Object)
], VerifyOtpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", Object)
], VerifyOtpDto.prototype, "otp", void 0);
class ResetPasswordDto {
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'test@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", Object)
], ResetPasswordDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", Object)
], ResetPasswordDto.prototype, "otp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NewStrongPassword123!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", Object)
], ResetPasswordDto.prototype, "password", void 0);
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async signup(signupDto) {
        if (!signupDto.email ||
            !signupDto.password ||
            !signupDto.firstName ||
            !signupDto.lastName) {
            throw new common_1.BadRequestException('Missing required signup fields');
        }
        if (signupDto.dob) {
            const birthDate = new Date(signupDto.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                throw new common_1.BadRequestException('You must be at least 18 years old');
            }
            else if (age > 70) {
                throw new common_1.BadRequestException('Age cannot exceed 70 years');
            }
        }
        return this.authService.signup(signupDto.email, signupDto.password, signupDto.firstName, signupDto.lastName, signupDto.phone, signupDto.dob, signupDto.role || 'investor', signupDto.addressLine1, signupDto.addressLine2, signupDto.city, signupDto.state, signupDto.zipCode, signupDto.country, signupDto.taxId);
    }
    async investorSignup(signupDto) {
        if (!signupDto.email ||
            !signupDto.password ||
            !signupDto.firstName ||
            !signupDto.lastName) {
            throw new common_1.BadRequestException('Missing required signup fields');
        }
        if (signupDto.dob) {
            const birthDate = new Date(signupDto.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                throw new common_1.BadRequestException('You must be at least 18 years old');
            }
            else if (age > 70) {
                throw new common_1.BadRequestException('Age cannot exceed 70 years');
            }
        }
        return this.authService.signup(signupDto.email, signupDto.password, signupDto.firstName, signupDto.lastName, signupDto.phone, signupDto.dob, signupDto.role || 'investor', signupDto.addressLine1, signupDto.addressLine2, signupDto.city, signupDto.state, signupDto.zipCode, signupDto.country, signupDto.taxId);
    }
    async login(loginDto) {
        if (!loginDto.email || !loginDto.password) {
            throw new common_1.BadRequestException('Missing required login fields');
        }
        return this.authService.login(loginDto.email, loginDto.password, loginDto.role);
    }
    async forgotPassword(forgotPasswordDto) {
        if (!forgotPasswordDto.email) {
            throw new common_1.BadRequestException('Email is required');
        }
        return this.authService.forgotPassword(forgotPasswordDto.email, forgotPasswordDto.role);
    }
    async verifyOtp(verifyOtpDto) {
        if (!verifyOtpDto.email || !verifyOtpDto.otp) {
            throw new common_1.BadRequestException('Email and OTP are required');
        }
        return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
    }
    async resetPassword(resetPasswordDto) {
        if (!resetPasswordDto.email || !resetPasswordDto.otp || !resetPasswordDto.password) {
            throw new common_1.BadRequestException('Email, OTP, and password are required');
        }
        return this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.otp, resetPasswordDto.password);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SignupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('investor-signup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SignupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "investorSignup", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map