import { IraAccountsService } from './ira-accounts.service';
import { CreateIraAccountDto } from './dto/create-ira-account.dto';
export declare class IraAccountsController {
    private readonly iraAccountsService;
    constructor(iraAccountsService: IraAccountsService);
    createIraAccount(user: any, data: CreateIraAccountDto): Promise<any>;
    getMyIraAccount(user: any): Promise<any>;
}
//# sourceMappingURL=ira-accounts.controller.d.ts.map