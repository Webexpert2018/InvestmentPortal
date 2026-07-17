import { Module } from '@nestjs/common';
import { WebinarCampaignController, WebinarCampaignPublicController } from './webinar-campaign.controller';
import { WebinarCampaignService } from './webinar-campaign.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [WebinarCampaignController, WebinarCampaignPublicController],
  providers: [WebinarCampaignService],
  exports: [WebinarCampaignService],
})
export class WebinarCampaignModule {}
