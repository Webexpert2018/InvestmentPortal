import { Module } from '@nestjs/common';
import { FundTransfersService } from './fund-transfers.service';
import { FundTransfersController } from './fund-transfers.controller';
import { DocusignModule } from '../docusign/docusign.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DocusignModule, UsersModule],
  controllers: [FundTransfersController],
  providers: [FundTransfersService],
  exports: [FundTransfersService],
})
export class FundTransfersModule {}
