import { Controller, Post, Get, Param, Query, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { RingCentralService } from './ringcentral.service';

@Controller('api/ringcentral')
export class RingCentralController {
  constructor(private readonly ringCentralService: RingCentralService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getToken() {
    return this.ringCentralService.getAccessToken();
  }

  @Post('sip-provision')
  @HttpCode(HttpStatus.OK)
  async getSipProvision() {
    return this.ringCentralService.getSipProvision();
  }

  @Get('call-logs')
  async getCallLogs() {
    return this.ringCentralService.getRecentCallLogs();
  }

  @Get('transcript/:sessionId')
  async getTranscript(@Param('sessionId') sessionId: string, @Query('recordingId') recordingId?: string) {
    return this.ringCentralService.getAndSaveCallTranscript(sessionId, recordingId);
  }

  @Get('recording/:recordingId')
  async downloadRecording(@Param('recordingId') recordingId: string, @Res() res: Response) {
    try {
      const buffer = await this.ringCentralService.downloadRecording(recordingId);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="recording-${recordingId}.mp3"`,
      });
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Failed to download recording');
    }
  }
}
