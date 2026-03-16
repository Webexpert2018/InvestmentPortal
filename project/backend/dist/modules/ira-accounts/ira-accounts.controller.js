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
exports.IraAccountsController = void 0;
const common_1 = require("@nestjs/common");
const ira_accounts_service_1 = require("./ira-accounts.service");
const jwt_auth_guard_1 = require("../../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../decorators/current-user.decorator");
const create_ira_account_dto_1 = require("./dto/create-ira-account.dto");
let IraAccountsController = class IraAccountsController {
    constructor(iraAccountsService) {
        this.iraAccountsService = iraAccountsService;
    }
    async createIraAccount(user, data) {
        return this.iraAccountsService.createIraAccount(user.userId, data);
    }
    async getMyIraAccount(user) {
        return this.iraAccountsService.getMyIraAccount(user.userId);
    }
};
exports.IraAccountsController = IraAccountsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_ira_account_dto_1.CreateIraAccountDto]),
    __metadata("design:returntype", Promise)
], IraAccountsController.prototype, "createIraAccount", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IraAccountsController.prototype, "getMyIraAccount", null);
exports.IraAccountsController = IraAccountsController = __decorate([
    (0, common_1.Controller)('api/ira-accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ira_accounts_service_1.IraAccountsService])
], IraAccountsController);
//# sourceMappingURL=ira-accounts.controller.js.map