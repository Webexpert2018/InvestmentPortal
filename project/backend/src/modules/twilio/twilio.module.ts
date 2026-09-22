import { Module } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { TwilioGateway } from './twilio.gateway';

@Module({
  controllers: [TwilioController],
  providers: [TwilioService, TwilioGateway],
  exports: [TwilioService],
})
export class TwilioModule {}
