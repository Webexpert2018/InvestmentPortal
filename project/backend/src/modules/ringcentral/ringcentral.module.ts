import { Module } from '@nestjs/common';
import { RingCentralService } from './ringcentral.service';
import { RingCentralController } from './ringcentral.controller';
import { RingCentralGateway } from './ringcentral.gateway';
import { RealtimeTranscriptionService } from './realtime-transcription.service';

@Module({
  controllers: [RingCentralController],
  providers: [RingCentralService, RingCentralGateway, RealtimeTranscriptionService],
  exports: [RingCentralService],
})
export class RingCentralModule { }