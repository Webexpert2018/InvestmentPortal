import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { DocusignModule } from '../docusign/docusign.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DocusignModule, EmailModule],
  providers: [InvestmentsService],
  controllers: [InvestmentsController],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
