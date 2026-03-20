"use strict";
// import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
// import { IraAccountsService } from './ira-accounts.service';
// import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
// import { CurrentUser } from '../../decorators/current-user.decorator';
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsController = void 0;
// @Controller('api/ira-accounts')
// @UseGuards(JwtAuthGuard)
// export class IraAccountsController {
//   constructor(private readonly iraAccountsService: IraAccountsService) {}
//   @Post()
//   async createIraAccount(@CurrentUser() user: any, @Body() data: CreateIraAccountDto) {
//     return this.iraAccountsService.createIraAccount(user.userId, data);
//   }
//   @Get('my')
//   async getMyIraAccount(@CurrentUser() user: any) {
//     return this.iraAccountsService.getMyIraAccount(user.userId);
//   }
// }
const common_1 = require("@nestjs/common");
const ira_accounts_service_1 = require("./ira-accounts.service");
const create_ira_account_dto_1 = require("./dto/create-ira-account.dto");
let AccountsController = class AccountsController {
    constructor(accountsService) {
        this.accountsService = accountsService;
    }
    async createAccount(userId, dto, authHeader) {
        const token = authHeader?.replace('Bearer ', '');
        return this.accountsService.createAccount(userId, dto, token);
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Post)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_ira_account_dto_1.CreateAccountDto, String]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "createAccount", null);
exports.AccountsController = AccountsController = __decorate([
    (0, common_1.Controller)('accounts'),
    __metadata("design:paramtypes", [ira_accounts_service_1.AccountsService])
], AccountsController);
//# sourceMappingURL=ira-accounts.controller.js.map