import { Module } from '@nestjs/common';
import { DocumentSignaturesController } from './document-signatures.controller';
import { DocumentSignaturesService } from './document-signatures.service';
import { EmailModule } from '../email/email.module';
import { DocusignModule } from '../docusign/docusign.module';

@Module({
  imports: [EmailModule, DocusignModule],
  controllers: [DocumentSignaturesController],
  providers: [DocumentSignaturesService],
})
export class DocumentSignaturesModule {}
