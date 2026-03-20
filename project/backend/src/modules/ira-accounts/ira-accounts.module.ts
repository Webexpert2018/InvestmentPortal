// import { Module } from '@nestjs/common';
// import { IraAccountsController } from './ira-accounts.controller';
// import { IraAccountsService } from './ira-accounts.service';
// @Module({ controllers: [IraAccountsController], providers: [IraAccountsService] })
// export class IraAccountsModule {}


import { Module } from '@nestjs/common';
import { AccountsService } from './ira-accounts.service';
import { AccountsController } from './ira-accounts.controller';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class IraAccountsModule {}