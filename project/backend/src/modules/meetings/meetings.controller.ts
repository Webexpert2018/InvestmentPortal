import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a new meeting' })
  async createMeeting(@Request() req: any, @Body() body: any) {
    return this.meetingsService.createMeeting(req.user, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all meetings for the logged-in user' })
  async getMyMeetings(@Request() req: any) {
    return this.meetingsService.getMyMeetings(req.user);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get available users to schedule a meeting with' })
  async getAvailableUsers(@Request() req: any) {
    return this.meetingsService.getAvailableUsers(req.user);
  }

  @Get('pending/count')
  @ApiOperation({ summary: 'Get the count of pending meeting invitations' })
  async getPendingMeetingsCount(@Request() req: any) {
    return this.meetingsService.getPendingMeetingsCount(req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Accept or reject a meeting invitation' })
  async updateMeetingStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status: 'accepted' | 'rejected' }) {
    return this.meetingsService.updateMeetingStatus(req.user, id, body.status);
  }
}
