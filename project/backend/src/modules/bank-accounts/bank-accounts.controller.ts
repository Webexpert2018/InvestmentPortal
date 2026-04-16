import { Controller, Get, Post, Delete, Body, Param, UseGuards, Patch, BadRequestException } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    console.log('📌 [BankAccounts] Finding all for user:', user.userId);
    if (!user || !user.userId) {
      throw new BadRequestException('User information not available');
    }
    return this.bankAccountsService.findAll(user.userId);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() data: any) {
    console.log('📌 [BankAccounts] Creating new for user:', user.userId, 'Data:', data);
    if (!user || !user.userId) {
      throw new BadRequestException('User information not available');
    }
    const validateErrors = this.validateBankAccount(data);
    if (validateErrors.length > 0) {
      throw new BadRequestException(validateErrors.join(', '));
    }
return this.bankAccountsService.create(user.userId, data, user);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    console.log('📌 [BankAccounts] Deleting:', id, 'for user:', user.userId);
    if (!user || !user.userId) {
      throw new BadRequestException('User information not available');
    }
    if (!id) {
      throw new BadRequestException('Bank account ID is required');
    }
    return this.bankAccountsService.delete(user.userId, id);
  }

  @Patch(':id')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    console.log('📌 [BankAccounts] Updating:', id, 'for user:', user.userId, 'Data:', data);
    if (!user || !user.userId) {
      throw new BadRequestException('User information not available');
    }
    if (!id) {
      throw new BadRequestException('Bank account ID is required');
    }
    const validateErrors = this.validateBankAccount(data, false);
    if (validateErrors.length > 0) {
      throw new BadRequestException(validateErrors.join(', '));
    }
return this.bankAccountsService.update(user.userId, id, data, user);
  }

  private validateBankAccount(data: any, isCreate: boolean = true): string[] {
    const errors: string[] = [];

  const isValidAccount = (val: string) => /^\d{8,17}$/.test(val);
  const isValidRouting = (val: string) => /^\d{9}$/.test(val);

    if (isCreate) {
      if (!data.bank_name || !data.bank_name.trim()) errors.push('Bank name is required');
      // if (!data.account_number || !data.account_number.trim()) errors.push('Account number is required');
      // if (!data.routing_number || !data.routing_number.trim()) errors.push('Routing number is required');
       if (!data.account_number?.trim()) {
          errors.push('Account number is required');
        } else if (!isValidAccount(data.account_number)) {
          errors.push('Account number must be 8-17 digits');
        }

        if (!data.routing_number?.trim()) {
          errors.push('Routing number is required');
        } 
        // else if (!isValidRouting(data.routing_number)) {
        //   errors.push('Routing number must be 9 digits');
        // }
      if (!data.beneficiary_name || !data.beneficiary_name.trim()) errors.push('Beneficiary name is required');
      if (!data.bank_address || !data.bank_address.trim()) errors.push('Bank address is required');
    } else {
      if (data.bank_name !== undefined && !data.bank_name.trim()) errors.push('Bank name cannot be empty');
      // if (data.account_number !== undefined && !data.account_number.trim()) errors.push('Account number cannot be empty');
      // if (data.routing_number !== undefined && !data.routing_number.trim()) errors.push('Routing number cannot be empty');

      if (data.account_number !== undefined) {
      if (!data.account_number.trim()) {
        errors.push('Account number cannot be empty');
      } else if (!isValidAccount(data.account_number)) {
        errors.push('Account number must be 8-17 digits');
      }
    }

    if (data.routing_number !== undefined) {
      if (!data.routing_number.trim()) {
        errors.push('Routing number cannot be empty');
      } else if (!isValidRouting(data.routing_number)) {
        errors.push('Routing number must be 9 digits');
      }
    }
      if (data.beneficiary_name !== undefined && !data.beneficiary_name.trim()) errors.push('Beneficiary name cannot be empty');
      if (data.bank_address !== undefined && !data.bank_address.trim()) errors.push('Bank address cannot be empty');
    }
    return errors;
  }
}
