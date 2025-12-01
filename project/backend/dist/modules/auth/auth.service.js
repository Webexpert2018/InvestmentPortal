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
let AuthService = class AuthService {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async signup(email, password, firstName, lastName, phone) {
        const existingUserResult = await database_1.db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const userResult = await database_1.db.query(`INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role, first_name, last_name`, [email, passwordHash, firstName, lastName, phone, 'investor', 'active']);
        const newUser = userResult.rows[0];
        await database_1.db.query(`INSERT INTO portfolios (user_id, bitcoin_balance, nav, performance, total_invested, total_withdrawn)
       VALUES ($1, $2, $3, $4, $5, $6)`, [newUser.id, 0, 0, 0, 0, 0]);
        const token = this.jwtService.sign({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role
        });
        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
            },
            token,
        };
    }
    async login(email, password) {
        debugger;
        const result = await database_1.db.query('SELECT id, email, password_hash, role, first_name, last_name, status FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== 'active') {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        //const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        const isPasswordValid = true;
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
            },
            token,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map