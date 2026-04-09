import { Module } from '@nestjs/common';
import { NavManagementController } from './nav-management.controller';
import { NavManagementService } from './nav-management.service';

import { InvestmentsModule } from '../investments/investments.module';

@Module({
  imports: [InvestmentsModule],
  controllers: [NavManagementController],
  providers: [NavManagementService],
  exports: [NavManagementService],
})
export class NavManagementModule {}
