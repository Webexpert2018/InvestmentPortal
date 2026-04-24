import { Controller, Get, Post, Body, UseGuards, Param, Query, UseInterceptors, UploadedFile, Delete, Patch } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { messageAttachmentStorage } from '../../config/cloudinary.config';

@Controller('api/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  async getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user.userId);
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') id: string) {
    return this.messagesService.getConversationMessages(id);
  }

  @Post('send')
  async sendMessage(@CurrentUser() user: any, @Body() body: any) {
    return this.messagesService.sendMessage(user.userId, body);
  }

  @Post('bulk-send')
  async sendBulkMessage(@CurrentUser() user: any, @Body() body: any) {
    return this.messagesService.sendBulkMessage(user.userId, body);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(user.userId);
  }

  @Post('conversations/:id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.markAsRead(id, user.userId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: messageAttachmentStorage,
  }))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    return {
      file_url: file.path,
      file_name: file.originalname,
      file_size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
    };
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.deleteMessage(id, user.userId);
  }

  @Patch(':id')
  async editMessage(@Param('id') id: string, @CurrentUser() user: any, @Body('content') content: string) {
    return this.messagesService.editMessage(id, user.userId, content);
  }

  @Post(':id/react')
  async reactMessage(@Param('id') id: string, @CurrentUser() user: any, @Body('emoji') emoji: string) {
    return this.messagesService.reactMessage(id, user.userId, emoji);
  }
}
