import { Controller, Post, Get, Put, Delete, Param, Body, Query, UseGuards, Res, Request } from '@nestjs/common';
import { Response } from 'express';
import { WebinarCampaignService } from './webinar-campaign.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/webinar-campaign')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'executive_admin', 'investor_relations')
export class WebinarCampaignController {
  constructor(private readonly webinarCampaignService: WebinarCampaignService) { }

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

  @Post('generate-sequence')
  async generateSequence(
    @Body()
    body: {
      prospectId?: string;
      mockDoctorData?: any;
    }
  ) {
    return this.webinarCampaignService.generateDoctorSequence(
      body.prospectId,
      body.mockDoctorData
    );
  }

  @Post('prospects/:id/launch')
  async launchSequence(@Param('id') id: string) {
    return this.webinarCampaignService.launchSequence(id);
  }

  @Get('prospects/:id/notes')
  async getProspectNotes(@Param('id') id: string) {
    const notes = await this.webinarCampaignService.getProspectNotes(id);
    return {
      success: true,
      notes,
    };
  }

  @Post('prospects/:id/notes')
  async addProspectNote(
    @Param('id') id: string,
    @Body() body: { note: string; authorName?: string }
  ) {
    const newNote = await this.webinarCampaignService.addProspectNote(id, body.note, body.authorName);
    return {
      success: true,
      note: newNote,
    };
  }

  @Delete('prospects/notes/:noteId')
  async deleteProspectNote(@Param('noteId') noteId: string) {
    return this.webinarCampaignService.deleteProspectNote(Number(noteId));
  }

  @Post('prospects/stage')
  async updateProspectStage(@Body() body: { prospectId: string; stage: string }) {
    return this.webinarCampaignService.updateProspectStage(body.prospectId, body.stage);
  }

  @Post('prospects/call-action')
  async updateProspectCallAction(@Body() body: { prospectId: string; callAction: string }) {
    return this.webinarCampaignService.updateProspectCallAction(body.prospectId, body.callAction);
  }

  @Post('prospects/create')
  async addManualProspect(
    @Body()
    body: {
      fullName: string;
      specialty?: string;
      organization?: string;
      location?: string;
      email: string;
      phone?: string;
    }
  ) {
    return this.webinarCampaignService.addManualProspect(body);
  }

  @Post('prospects/bulk-create')
  async bulkAddProspects(
    @Body()
    body: {
      prospects: Array<{
        fullName: string;
        specialty?: string;
        organization?: string;
        location?: string;
        email?: string;
        phone?: string;
        stage?: string;
      }>;
    }
  ) {
    return this.webinarCampaignService.bulkAddProspects(body.prospects);
  }

  @Get('webinars')
  async getAllWebinars(@Request() req: any) {
    return this.webinarCampaignService.getAllWebinars(req.user?.userId);
  }

  @Post('webinars')
  async createWebinar(
    @Request() req: any,
    @Body()
    body: {
      title: string;
      description?: string;
      webinarDate: string;
      webinarTime?: string;
      duration?: string;
      meetingLink: string;
    }
  ) {
    return this.webinarCampaignService.createWebinar(req.user.userId, body);
  }

  @Delete('webinars/:id')
  async deleteWebinar(@Param('id') id: string) {
    return this.webinarCampaignService.deleteWebinar(id);
  }

  @Put('webinars/:id')
  async updateWebinar(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      description?: string;
      webinarDate: string;
      webinarTime?: string;
      duration?: string;
      meetingLink: string;
    }
  ) {
    return this.webinarCampaignService.updateWebinar(req.user.userId, id, body);
  }

  @Post('webinars/:id/activate')
  async activateWebinar(@Param('id') id: string) {
    return this.webinarCampaignService.activateWebinar(id);
  }

  @Post('webinars/:id/add-doctor-invite')
  async addDoctorAndSendInvite(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      fullName: string;
      email: string;
      specialty?: string;
      phone?: string;
      organization?: string;
      location?: string;
    }
  ) {
    return this.webinarCampaignService.addDoctorAndSendInvite(req.user.userId, id, body);
  }

  @Post('webinars/:id/send-invites')
  async sendDirectInvites(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { prospectIds: string[] }
  ) {
    return this.webinarCampaignService.sendDirectWebinarInvites(req.user.userId, id, body.prospectIds);
  }

  @Post('webinars/:id/import-previous')
  async importPrevious(@Request() req: any, @Param('id') id: string) {
    return this.webinarCampaignService.importPreviousWebinarAttendees(req.user.userId, id);
  }

  @Put('webinars/:id/reminders')
  async updateWebinarReminders(
    @Param('id') id: string,
    @Body() body: { reminderOffsets: number[] }
  ) {
    return this.webinarCampaignService.updateWebinarReminders(id, body.reminderOffsets);
  }

  @Post('webinars/:id/send-test-reminder')
  async sendTestReminder(@Param('id') id: string) {
    return this.webinarCampaignService.sendTestWebinarReminder(id);
  }

  @Post('send-step-now')
  async sendStepNow(
    @Body() body: { prospectId: string; day: number }
  ) {
    return this.webinarCampaignService.sendSequenceStepNow(body.prospectId, body.day);
  }

  @Post('agent/chat')
  async queryCrmAgent(@Request() req: any, @Body('query') query: string) {
    return this.webinarCampaignService.queryCrmAgent(req.user.userId, query);
  }
}

@Controller('api/webinar-campaign')
export class WebinarCampaignPublicController {
  constructor(private readonly webinarCampaignService: WebinarCampaignService) { }

  @Get('webinar-pass')
  async getWebinarPass(
    @Query('webinarId') webinarId: string,
    @Query('prospectId') prospectId: string
  ) {
    return this.webinarCampaignService.getWebinarPassDetails(webinarId, prospectId);
  }

  @Post('attend')
  async recordAttendance(
    @Body() body: { webinarId: string; prospectId: string }
  ) {
    return this.webinarCampaignService.recordWebinarJoinSession(body.webinarId, body.prospectId);
  }

  @Post('heartbeat')
  async recordHeartbeat(
    @Body() body: { sessionId?: number; webinarId?: string; prospectId?: string }
  ) {
    return this.webinarCampaignService.recordWebinarHeartbeat(body.sessionId, body.webinarId, body.prospectId);
  }

  @Post('apollo-phone-webhook')
  async apolloPhoneWebhook(@Body() body: any) {
    return this.webinarCampaignService.handleApolloWebhook(body);
  }

  @Get('respond')
  async respondToOutreach(
    @Query('id') id: string,
    @Query('email') email: string,
    @Query('status') status: string,
    @Query('response') response: string,
    @Res() res: Response
  ) {
    const targetIdentifier = id || email;
    const targetStatus = status || response;

    if (targetIdentifier && targetStatus) {
      await this.webinarCampaignService.recordProspectResponse(targetIdentifier, targetStatus);
    }
    const isInterested = targetStatus === 'interested';
    if (isInterested) {
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
            p { color: #64748B; font-size: 16px; line-height: 1.6; margin-bottom: 0px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 52px; margin-bottom: 15px;">🎉</div>
            <h1>Interest Confirmed!</h1>
            <p>Thank you for expressing interest in our Physician Wealth Webinar. We have recorded your status and sent you Google Calendar invitation directly to your email inbox.</p>
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


  @Get('cron/reminders')
  async triggerCronReminders() {
    await this.webinarCampaignService.processAutomatedWebinarReminders();
    return { success: true, message: 'Automated webinar reminders processed successfully' };
  }

  @Get('cron/drip')
  async triggerCronDrip() {
    await this.webinarCampaignService.processScheduledDripEmails();
    return { success: true, message: 'Drip campaign cron processed successfully' };
  }
}
