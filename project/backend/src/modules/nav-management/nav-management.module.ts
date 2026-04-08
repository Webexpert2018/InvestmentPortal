import { Module } from '@nestjs/common';
import { NavManagementController } from './nav-management.controller';
import { NavManagementService } from './nav-management.service';

@Module({
  controllers: [NavManagementController],
  providers: [NavManagementService],
  exports: [NavManagementService],
})
export class NavManagementModule {}
