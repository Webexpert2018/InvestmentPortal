import { CreateAccountDto } from './dto/create-ira-account.dto';
export declare class AccountsService {
    private readonly API_BASE;
    constructor();
    createAccount(userId: number, dto: CreateAccountDto, token: string): Promise<any>;
}
//# sourceMappingURL=ira-accounts.service.d.ts.map