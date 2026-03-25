import { Controller, Post, Get, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { AccountsService } from './ira-accounts.service';
import { CreateAccountDto } from './dto/create-ira-account.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/ira-accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('my')
  async getMyIraAccount(@CurrentUser() user: any) {
    return this.accountsService.getMyIraAccount(user.userId);
  }


  @Post(':userId')
  async createAccount(
    @Param('userId') userId: string,
    @Body() dto: CreateAccountDto,
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    return this.accountsService.createAccount(userId, dto, token);
  }
}