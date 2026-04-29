import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { DocusignModule } from '../docusign/docusign.module';

@Module({
  imports: [DocusignModule],
  providers: [InvestmentsService],
  controllers: [InvestmentsController],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}

