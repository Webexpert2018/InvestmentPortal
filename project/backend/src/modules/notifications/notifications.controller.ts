import { Controller, Get, Patch, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  async getNotifications(@CurrentUser() user: any) {
    if (!user.userId) throw new UnauthorizedException('User not authenticated');
    return this.notificationsService.getNotifications(user.userId, user.role);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    if (!user.userId) throw new UnauthorizedException('User not authenticated');
    return { count: await this.notificationsService.getUnreadCount(user.userId, user.role) };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user.userId) throw new UnauthorizedException('User not authenticated');
    return this.notificationsService.markAsRead(id, user.userId, user.role);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@CurrentUser() user: any) {
    if (!user.userId) throw new UnauthorizedException('User not authenticated');
    return this.notificationsService.markAllAsRead(user.userId, user.role);
  }
}
