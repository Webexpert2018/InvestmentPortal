import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';

@Controller('api/redemptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() data: any) {
    return this.redemptionsService.create(user.userId, data);
  }

  @Get('my')
  async findAll(@CurrentUser() user: any) {
    return this.redemptionsService.findAllForUser(user.userId);
  }

  @Get('investor/:id')
  @Roles('admin', 'staff', 'accountant')
  async getInvestorRedemptions(@Param('id') id: string) {
    return this.redemptionsService.findAllForUser(id);
  }

  @Get('all')
  @Roles('admin', 'staff')
  async findAllGlobal() {
    return this.redemptionsService.findAll();
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role === 'admin' || user.role === 'staff') {
      return this.redemptionsService.findOneGlobal(id);
    }
    return this.redemptionsService.findOne(id, user.userId);
  }

  @Post(':id/cancel')
  async cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.redemptionsService.cancel(id, user.userId);
  }

  @Patch(':id/status')
  @Roles('admin', 'staff')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.redemptionsService.updateStatus(id, status);
  }
}
