import { Controller, Post, Get, Body, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { WebinarCampaignService } from './webinar-campaign.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/webinar-campaign')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'executive_admin', 'investor_relations')
export class WebinarCampaignController {
  constructor(private readonly webinarCampaignService: WebinarCampaignService) {}

  @Post('apollo/search')
  async searchApollo(
    @Body()
    body: {
      specialties?: string;
      locations?: string;
      seniorities?: string;
      count?: number;
    }
  ) {
    const results = await this.webinarCampaignService.searchApollo(
      body.specialties || '',
      body.locations || '',
      body.seniorities || '',
      body.count || 50
    );
    return {
      success: true,
      count: results.length,
      prospects: results,
    };
  }

  @Post('apollo/bulk-enrich-save')
  async bulkEnrichAndSave(
    @Body()
    body: {
      apolloIds: string[];
      mockProfilesData?: any[];
    }
  ) {
    return this.webinarCampaignService.bulkMatchAndSave(
      body.apolloIds || [],
      body.mockProfilesData
    );
  }

  @Get('prospects')
  async getSavedProspects(@Query('limit') limit?: number) {
    const rows = await this.webinarCampaignService.getSavedProspects(
      limit && !isNaN(Number(limit)) ? Number(limit) : 100
    );
    return {
      success: true,
      count: rows.length,
      prospects: rows,
    };
  }

  @Post('send-outreach')
  async sendOutreach(
    @Body()
    body: {
      prospectIds: string[];
      customMessage?: string;
      mockProfilesData?: any[];
    }
  ) {
    return this.webinarCampaignService.sendCampaignOutreach(
      body.prospectIds || [],
      body.customMessage,
      body.mockProfilesData
    );
  }
}

@Controller('api/webinar-campaign')
export class WebinarCampaignPublicController {
  constructor(private readonly webinarCampaignService: WebinarCampaignService) {}

  @Get('respond')
  async respondToOutreach(
    @Query('id') id: string,
    @Query('status') status: string,
    @Res() res: Response
  ) {
    if (id && status) {
      await this.webinarCampaignService.recordProspectResponse(id, status);
    }
    if (status === 'interested') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Interest Confirmed - Ovalia Capital</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #F8FAFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 45px 35px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); text-align: center; max-width: 480px; border: 1px solid #E2E8F0; }
            h1 { color: #1E293B; font-size: 24px; margin-bottom: 12px; }
            p { color: #64748B; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
            .btn { background: #22C55E; color: white; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 52px; margin-bottom: 15px;">🎉</div>
            <h1>Interest Confirmed!</h1>
            <p>Thank you for expressing interest in our Physician Wealth Webinar. We have recorded your status and our team will reach out shortly with exact event details.</p>
            <a href="https://lu.ma/ovaliacapital-physicians" class="btn" target="_blank">View Event Details on Luma</a>
          </div>
        </body>
        </html>
      `);
    } else {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preferences Updated - Ovalia Capital</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #F8F9FA; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 480px; border: 1px solid #E5E7EB; }
            h1 { color: #1F1F1F; font-size: 24px; margin-bottom: 12px; }
            p { color: #6B7280; font-size: 16px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
            <h1>Preferences Saved</h1>
            <p>Thank you for letting us know! We have updated your status and will not send further invitations for this session.</p>
          </div>
        </body>
        </html>
      `);
    }
  }
}
