import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('admin')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant')
  async getAdminStats() {
    return this.statsService.getAdminStats();
  }

  @Get('investor/:id')
  @Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant', 'staff', 'investor')
  async getInvestorStats(@Param('id') id: string) {
    return this.statsService.getInvestorStats(id);
  }
}
