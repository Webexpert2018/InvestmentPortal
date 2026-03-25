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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../config/database");
const axios_1 = __importDefault(require("axios"));
let AccountsService = class AccountsService {
    constructor() {
        this.API_BASE = 'https://sandbox.aet.dev/api/v3';
    }
    async getMyIraAccount(userId) {
        try {
            console.log('🔍 Fetching IRA account for user:', userId); // Added console.log here
            const result = await database_1.db.query('SELECT * FROM ira_accounts WHERE user_id = $1::uuid', [userId]);
            return result.rows[0];
        }
        catch (error) {
            console.error('❌ Error fetching IRA account:', error.message || error);
            throw new common_1.InternalServerErrorException('Failed to fetch IRA account: ' + (error.message || 'Unknown error'));
        }
    }
    async createAccount(userId, dto, token) {
        try {
            const response = await axios_1.default.post(`${this.API_BASE}/users/${userId}/accounts`, dto, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            throw new common_1.HttpException(error.response?.data || 'Failed to create account', error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AccountsService);
//# sourceMappingURL=ira-accounts.service.js.map