import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { IraAccountsService } from './ira-accounts.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateIraAccountDto } from './dto/create-ira-account.dto';

@Controller('api/ira-accounts')
@UseGuards(JwtAuthGuard)
export class IraAccountsController {
  constructor(private readonly iraAccountsService: IraAccountsService) {}

  @Post()
  async createIraAccount(@CurrentUser() user: any, @Body() data: CreateIraAccountDto) {
    return this.iraAccountsService.createIraAccount(user.userId, data);
  }

  @Get('my')
  async getMyIraAccount(@CurrentUser() user: any) {
    return this.iraAccountsService.getMyIraAccount(user.userId);
  }
}
