import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocusignService } from './docusign.service';
import { DocusignController } from './docusign.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, UsersModule],
  providers: [DocusignService],
  controllers: [DocusignController],
  exports: [DocusignService],
})
export class DocusignModule {}
