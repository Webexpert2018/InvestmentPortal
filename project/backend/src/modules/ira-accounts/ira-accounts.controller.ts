import { Controller, Post, Get, Patch, Body, Param, Headers, UseGuards, ForbiddenException } from '@nestjs/common';
import { AccountsService } from './ira-accounts.service';
import { CreateAccountDto } from './dto/create-ira-account.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/ira-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('my')
  async getMyIraAccount(@CurrentUser() user: any) {
    const account = await this.accountsService.getMyIraAccount(user.userId);
    return account || null;
  }

  @Get('types')
  async getAccountTypes() {
    return this.accountsService.getAccountTypes();
  }


  @Post()
  async createAccount(
    @CurrentUser() user: any,
    @Body() dto: CreateAccountDto,
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    
    let targetUserId = user.userId;
    
    // If admin/staff and targetUserId is provided, use it
    const adminRoles = ['admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant'];
    if (dto.targetUserId && dto.targetUserId !== user.userId) {
      if (!adminRoles.includes(user.role)) {
        throw new ForbiddenException('Only administrators can create accounts for other users');
      }
      targetUserId = dto.targetUserId;
    }

    return this.accountsService.createAccount(targetUserId, dto, token);
  }

  @Get('user/:id')
  async getUserIraAccounts(@Param('id') id: string, @CurrentUser() user: any) {
    const adminRoles = ['admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant'];
    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException('Only administrators can view other users\' IRA accounts');
    }
    return this.accountsService.getMyIraAccount(id);
  }

  @Patch(':id/status')
  async updateAccountStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: any
  ) {
    return this.accountsService.updateAccountStatus(id, body.status, user.role, user.userId);
  }
}