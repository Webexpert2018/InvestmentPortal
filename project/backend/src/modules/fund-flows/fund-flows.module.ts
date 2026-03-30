import { Module } from '@nestjs/common';
import { FundFlowsController } from './fund-flows.controller';
import { FundFlowsService } from './fund-flows.service';

@Module({
  controllers: [FundFlowsController],
  providers: [FundFlowsService],
  exports: [FundFlowsService],
})
export class FundFlowsModule {}
