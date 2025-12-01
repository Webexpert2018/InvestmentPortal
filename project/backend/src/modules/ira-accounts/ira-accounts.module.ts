import { Module } from '@nestjs/common';
import { IraAccountsController } from './ira-accounts.controller';
import { IraAccountsService } from './ira-accounts.service';
@Module({ controllers: [IraAccountsController], providers: [IraAccountsService] })
export class IraAccountsModule {}
