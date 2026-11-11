import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/email')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) { }

  @Get('logs')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  async getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('recipientEmail') recipientEmail?: string,
    @Query('recipientUserId') recipientUserId?: string,
    @Query('notificationType') notificationType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.emailService.getEmailNotificationLogs({
      page,
      limit,
      recipientEmail,
      recipientUserId,
      notificationType,
      status,
      startDate,
      endDate,
    });
  }

  // =========================================================================
  // EMAIL CAMPAIGNS (EMAIL UPDATES)
  // =========================================================================

  @Get('campaign-funds')
  @Roles('admin', 'executive_admin')
  async getCampaignFunds() {
    return this.emailService.getCampaignFunds();
  }

  @Get('campaign-recipients/:fundId')
  @Roles('admin', 'executive_admin')
  async getCampaignRecipients(@Param('fundId') fundId: string) {
    return this.emailService.getFundRecipients(fundId);
  }

  @Get('campaigns')
  @Roles('admin', 'executive_admin')
  async getCampaigns(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.emailService.getCampaigns({ status, search });
  }

  @Get('campaigns/:id')
  @Roles('admin', 'executive_admin')
  async getCampaignById(@Param('id') id: string) {
    return this.emailService.getCampaignById(id);
  }

  @Post('campaigns')
  @Roles('admin', 'executive_admin')
  async createCampaign(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.emailService.createCampaign(body, userId);
  }

  @Put('campaigns/:id')
  @Roles('admin', 'executive_admin')
  async updateCampaign(@Param('id') id: string, @Body() body: any) {
    return this.emailService.updateCampaign(id, body);
  }

  @Delete('campaigns/:id')
  @Roles('admin', 'executive_admin')
  async deleteCampaign(@Param('id') id: string) {
    return this.emailService.deleteCampaign(id);
  }

  @Post('campaigns/:id/send')
  @Roles('admin', 'executive_admin')
  async sendCampaign(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.emailService.sendCampaign(id, userId);
  }
}
