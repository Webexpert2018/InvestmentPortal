import { Controller, Get, Patch, Post, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
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
  async getBoard(@Req() req: any) {
    const { userId, role } = req.user || {};
    return this.pipelineService.findAll(userId, role);
  }

  @Patch('investors/:id/stage')
  async updateInvestorStage(
    @Param('id') id: string,
    @Body('stageId', ParseIntPipe) stageId: number,
  ) {
    return this.pipelineService.updateInvestorStage(id, stageId);
  }

  @Patch('investors/:id/details')
  async updateInvestorDetails(
    @Param('id') id: string,
    @Body() details: { expectedFutureInvestment?: number },
  ) {
    return this.pipelineService.updateInvestorDetails(id, details);
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

  @Patch('stages/reorder')
  async reorderStages(@Body('stageIds') stageIds: number[]) {
    return this.pipelineService.reorderStages(stageIds);
  }
}
