import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController, GoogleOAuthController } from './meetings.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [MeetingsController, GoogleOAuthController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
