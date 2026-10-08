import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { AthenaService } from './athena.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/athena')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('executive_admin')
export class AthenaController {
  private readonly logger = new Logger(AthenaController.name);

  constructor(private readonly athenaService: AthenaService) {}

  @Post('query')
  async queryAthena(@Request() req: any, @Body('query') query: string) {
    const userId = req.user?.userId || req.user?.id;
    return this.athenaService.queryAthena(userId, query);
  }
}
