import { Controller, Post, Get, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async sendMessage(@CurrentUser() user: any, @Body() data: { content: string; recipientId?: string; targetRole?: string }) {
    if (!user.userId) throw new UnauthorizedException('User not authenticated');
    return this.messagesService.sendMessage(user.userId, data);
  }

  @Get()
  async getMessages(@CurrentUser() user: any) {
    if (!user.userId) throw new UnauthorizedException('User not authenticated');
    return this.messagesService.getMessagesForUser(user.userId, user.role);
  }
}
