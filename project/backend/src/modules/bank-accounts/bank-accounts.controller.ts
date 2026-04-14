import { Controller, Get, Post, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.bankAccountsService.findAll(user.userId);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() data: any) {
    return this.bankAccountsService.create(user.userId, data);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bankAccountsService.delete(user.userId, id);
  }

  @Patch(':id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    return this.bankAccountsService.update(user.userId, id, data);
  }
}
