import { Controller, Get, Patch, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/pipeline')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'executive_admin', 'fund_admin', 'investor_relations')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  async getBoard() {
    return this.pipelineService.findAll();
  }

  @Patch('investors/:id/stage')
  async updateInvestorStage(
    @Param('id') id: string,
    @Body('stageId', ParseIntPipe) stageId: number,
  ) {
    return this.pipelineService.updateInvestorStage(id, stageId);
  }

  @Post('stages')
  async createStage(
    @Body('name') name: string,
    @Body('color') color: string,
  ) {
    return this.pipelineService.createStage(name, color);
  }

  @Delete('stages/:id')
  async deleteStage(@Param('id', ParseIntPipe) id: number) {
    return this.pipelineService.deleteStage(id);
  }
}
