"use strict";
// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { db } from '../../config/database';
// import { CreateIraAccountDto } from './dto/create-ira-account.dto';
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
// @Injectable()
// export class IraAccountsService {
//   async createIraAccount(userId: string, data: CreateIraAccountDto) {
//     try {
//       const result = await db.query(
//         `INSERT INTO ira_accounts (
//           user_id, account_type, account_number, custodian_name, beneficiary,
//           middle_name, suffix, marital_status, mailing_address_same,
//           mailing_address_1, mailing_address_2, mailing_city, mailing_state, mailing_zip_code, mailing_country,
//           username, referral_source,
//           first_name, last_name, email, dob, phone, tax_id,
//           physical_address_1, physical_address_2, city, state, zip_code, country
//         )
//          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
//          RETURNING *`,
//         [
//           userId, data.accountType, data.accountNumber, data.custodian, data.beneficiary,
//           data.middleName, data.suffix, data.maritalStatus, data.mailingAddressSame,
//           data.mailingAddress1, data.mailingAddress2, data.mailingCity, data.mailingState, data.mailingZipCode, data.mailingCountry,
//           data.username, data.referralSource,
//           data.firstName, data.lastName, data.email, data.dob, data.phone, data.taxId,
//           data.physicalAddress1, data.physicalAddress2, data.city, data.state, data.zipCode, data.country
//         ]
//       );
//       return result.rows[0];
//     } catch (error) {
//        console.error(error);
//        throw new InternalServerErrorException('Failed to create IRA account');
//     }
//   }
//   async getMyIraAccount(userId: string) {
//       const result = await db.query(
//         'SELECT * FROM ira_accounts WHERE user_id = $1',
//         [userId]
//       );
//       return result.rows[0];
//   }
// }
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let AccountsService = class AccountsService {
    constructor() {
        this.API_BASE = 'https://sandbox.aet.dev/api/v3';
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