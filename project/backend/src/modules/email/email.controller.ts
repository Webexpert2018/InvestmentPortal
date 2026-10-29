import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/email')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('logs')
  @Roles('admin', 'executive_admin', 'fund_admin')
  async getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('recipientEmail') recipientEmail?: string,
    @Query('notificationType') notificationType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.emailService.getEmailNotificationLogs({
      page,
      limit,
      recipientEmail,
      notificationType,
      status,
      startDate,
      endDate,
    });
  }
}
