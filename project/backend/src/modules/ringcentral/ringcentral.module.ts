import { Module } from '@nestjs/common';
import { RingCentralService } from './ringcentral.service';
import { RingCentralController } from './ringcentral.controller';

@Module({
  controllers: [RingCentralController],
  providers: [RingCentralService],
  exports: [RingCentralService],
})
export class RingCentralModule {}
