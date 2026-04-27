import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { PipelineCronService } from './pipeline-cron.service';

@Module({
  providers: [PipelineService, PipelineCronService],
  controllers: [PipelineController],
})
export class PipelineModule {}
