import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('api/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getSessions(@Req() req: any) {
    return this.sessionsService.getSessions(req.user.userId, req.user.sessionId);
  }

  @Delete(':id')
  async revokeSession(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.revokeSession(id, req.user.userId);
  }
}
