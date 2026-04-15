import { Controller, Get, Post, Body, UseGuards, Req, Param, Patch, Delete } from '@nestjs/common';
import { NavManagementService } from './nav-management.service';
import { CreateNavEntryDto } from './dto/create-nav-entry.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/nav-management')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NavManagementController {
  constructor(private readonly navManagementService: NavManagementService) {}

  @Get('summary')
  async getSummary() {
    return this.navManagementService.getSummary();
  }

  @Get('performance')
  async getPerformance(@Req() req: any) {
    const months = parseInt(req.query.months) || 12;
    return this.navManagementService.getPerformance(months);
  }

  @Get('history')
  @Roles('executive_admin', 'accountant')
  async getHistory() {
    return this.navManagementService.getHistory();
  }

  @Post('entries')
  @Roles('executive_admin', 'accountant')
  async createEntry(@Body() createNavEntryDto: CreateNavEntryDto, @Req() req: any) {
    return this.navManagementService.createEntry(createNavEntryDto, req.user.userId);
  }

  @Get('entries/:id')
  @Roles('executive_admin', 'accountant')
  async getEntryById(@Param('id') id: string) {
    return this.navManagementService.getEntryById(id);
  }

  @Patch('entries/:id')
  @Roles('executive_admin', 'accountant')
  async updateEntry(
    @Param('id') id: string,
    @Body() updateNavEntryDto: Partial<CreateNavEntryDto>,
    @Req() req: any
  ) {
    return this.navManagementService.updateEntry(id, updateNavEntryDto, req.user.userId);
  }

  @Delete('entries/:id')
  @Roles('executive_admin', 'accountant')
  async deleteEntry(@Param('id') id: string) {
    return this.navManagementService.deleteEntry(id);
  }
}
