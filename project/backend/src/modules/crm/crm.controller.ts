import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('investors')
  async getActiveInvestors(@CurrentUser() user: any) {
    return this.crmService.getActiveInvestors(user.role);
  }

  @Post('send-bulk-email')
  async sendBulkEmail(
    @CurrentUser() user: any,
    @Body() body: { investorIds: string[]; subject: string; message: string }
  ) {
    return this.crmService.sendBulkEmail(
      user.role,
      body.investorIds,
      body.subject,
      body.message
    );
  }
}
