import { Module } from '@nestjs/common';
import { WebinarCampaignController, WebinarCampaignPublicController } from './webinar-campaign.controller';
import { WebinarCampaignService } from './webinar-campaign.service';
import { EmailModule } from '../email/email.module';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
  imports: [EmailModule, MeetingsModule],
  controllers: [WebinarCampaignController, WebinarCampaignPublicController],
  providers: [WebinarCampaignService],
  exports: [WebinarCampaignService],
})
export class WebinarCampaignModule {}
