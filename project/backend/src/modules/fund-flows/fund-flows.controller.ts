import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FundFlowsService } from './fund-flows.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/fund-flows')
@UseGuards(JwtAuthGuard)
export class FundFlowsController {
  constructor(private readonly fundFlowsService: FundFlowsService) {}

  @Get()
  findAll(@Req() req: any) {
    if (req.user.role === 'admin') {
      return this.fundFlowsService.getAllFlows();
    }
    return this.fundFlowsService.getFlowsByUser(req.user.userId);
  }

  @Post()
  create(@Req() req: any, @Body() createFlowDto: any) {
    return this.fundFlowsService.createFlow(req.user.userId, createFlowDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.fundFlowsService.updateFlowStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.fundFlowsService.deleteFlow(id);
  }
}
