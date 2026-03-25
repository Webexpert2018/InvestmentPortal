import { AccountsService } from './ira-accounts.service';
import { CreateAccountDto } from './dto/create-ira-account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getMyIraAccount(user: any): Promise<any>;
    createAccount(userId: string, dto: CreateAccountDto, authHeader: string): Promise<any>;
}
//# sourceMappingURL=ira-accounts.controller.d.ts.map