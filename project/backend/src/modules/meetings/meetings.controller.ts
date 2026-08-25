import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query, Res } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Meetings')
@Controller('api/meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Schedule a new meeting' })
  async createMeeting(@Request() req: any, @Body() body: any) {
    return this.meetingsService.createMeeting(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all meetings for the logged-in user' })
  async getMyMeetings(@Request() req: any) {
    return this.meetingsService.getMyMeetings(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('users')
  @ApiOperation({ summary: 'Get available users to schedule a meeting with' })
  async getAvailableUsers(@Request() req: any) {
    return this.meetingsService.getAvailableUsers(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('pending/count')
  @ApiOperation({ summary: 'Get the count of pending meeting invitations' })
  async getPendingMeetingsCount(@Request() req: any) {
    return this.meetingsService.getPendingMeetingsCount(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Accept or reject a meeting invitation' })
  async updateMeetingStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status: 'accepted' | 'rejected' }) {
    return this.meetingsService.updateMeetingStatus(req.user, id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Edit/update a scheduled meeting' })
  async updateMeeting(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.meetingsService.updateMeeting(req.user, id, body);
  }

  // --- Google Calendar Endpoints ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('google/auth-url')
  @ApiOperation({ summary: 'Get Google OAuth URL' })
  async getGoogleAuthUrl(@Request() req: any) {
    const url = await this.meetingsService.getGoogleAuthUrl(req.user.userId);
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('google/token-status')
  @ApiOperation({ summary: 'Check if Google Calendar is connected' })
  async getGoogleTokenStatus(@Request() req: any) {
    return this.meetingsService.getGoogleTokenStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('google/events')
  @ApiOperation({ summary: 'Get all Google Calendar sandbox events' })
  async getGoogleCalendarEvents(@Request() req: any) {
    return this.meetingsService.getGoogleCalendarEvents(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('google/create-event')
  @ApiOperation({ summary: 'Create Google Calendar event and send invite' })
  async createGoogleEvent(@Request() req: any, @Body() body: { title: string; description?: string; scheduledDate: string; durationMinutes?: number; attendeeEmails?: string[] }) {
    return this.meetingsService.createGoogleEvent(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('google/invite')
  @ApiOperation({ summary: 'Invite guest to Google Calendar event' })
  async inviteGuest(@Request() req: any, @Body() body: { googleEventId: string; attendeeEmail: string }) {
    return this.meetingsService.addAttendeeToGoogleEvent(req.user.userId, body.googleEventId, body.attendeeEmail);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('google/event-status/:eventId')
  @ApiOperation({ summary: 'Get Google Calendar event status and RSVPs' })
  async getGoogleEventStatus(@Request() req: any, @Param('eventId') eventId: string) {
    return this.meetingsService.getGoogleEventStatus(req.user.userId, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('google/respond-event')
  @ApiOperation({ summary: 'Update RSVP status for attendee' })
  async respondToGoogleEvent(
    @Request() req: any, 
    @Body() body: { googleEventId: string; attendeeEmail: string; responseStatus: 'accepted' | 'declined' | 'tentative' }
  ) {
    return this.meetingsService.respondToGoogleEvent(req.user.userId, body.googleEventId, body.attendeeEmail, body.responseStatus);
  }
}

// Separate Controller to match exactly the configured Google Redirect URI (/auth/google/callback)
@ApiTags('Meetings OAuth Callback')
@Controller('auth/google')
export class GoogleOAuthController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get('callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: any) {
    await this.meetingsService.handleGoogleCallback(state, code);
    
    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://investmentportalfrontend.vercel.app' 
      : 'http://localhost:3000');
    
    return res.redirect(`${frontendUrl}/dashboard/google-calendar?success=true`);
  }
}
