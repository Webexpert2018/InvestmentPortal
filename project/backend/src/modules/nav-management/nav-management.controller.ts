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

  @Get('history')
  @Roles('admin')
  async getHistory() {
    return this.navManagementService.getHistory();
  }

  @Post('entries')
  @Roles('admin')
  async createEntry(@Body() createNavEntryDto: CreateNavEntryDto, @Req() req: any) {
    return this.navManagementService.createEntry(createNavEntryDto, req.user.userId);
  }

  @Get('entries/:id')
  @Roles('admin')
  async getEntryById(@Param('id') id: string) {
    return this.navManagementService.getEntryById(id);
  }

  @Patch('entries/:id')
  @Roles('admin')
  async updateEntry(
    @Param('id') id: string,
    @Body() updateNavEntryDto: Partial<CreateNavEntryDto>,
    @Req() req: any
  ) {
    return this.navManagementService.updateEntry(id, updateNavEntryDto, req.user.userId);
  }

  @Delete('entries/:id')
  @Roles('admin')
  async deleteEntry(@Param('id') id: string) {
    return this.navManagementService.deleteEntry(id);
  }
}
