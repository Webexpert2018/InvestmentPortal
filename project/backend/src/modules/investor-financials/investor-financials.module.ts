import { Module } from '@nestjs/common';
import { InvestorFinancialsController } from './investor-financials.controller';
import { InvestorFinancialsService } from './investor-financials.service';

@Module({
  controllers: [InvestorFinancialsController],
  providers: [InvestorFinancialsService],
  exports: [InvestorFinancialsService],
})
export class InvestorFinancialsModule {}
