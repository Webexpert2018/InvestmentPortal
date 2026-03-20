// import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
// import { IraAccountsService } from './ira-accounts.service';
// import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
// import { CurrentUser } from '../../decorators/current-user.decorator';
// import { CreateIraAccountDto } from './dto/create-ira-account.dto';

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

import { Controller, Post, Body, Param, Headers } from '@nestjs/common';
import { AccountsService } from './ira-accounts.service';
import { CreateAccountDto } from './dto/create-ira-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post(':userId')
  async createAccount(
    @Param('userId') userId: number,
    @Body() dto: CreateAccountDto,
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    return this.accountsService.createAccount(userId, dto, token);
  }
}