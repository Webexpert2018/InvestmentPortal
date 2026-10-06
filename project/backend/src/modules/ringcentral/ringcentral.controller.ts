import { Controller, Post, Get, Param, Query, Res, HttpCode, HttpStatus, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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

  @Post('call-log')
  @HttpCode(HttpStatus.OK)
  async saveCallLog(@Body() body: any) {
    return this.ringCentralService.saveCallLog(body);
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

  @Get('internal-logs')
  async getInternalLogs() {
    return this.ringCentralService.getInternalLogs();
  }

  @Get('transcript/:sessionId')
  async getTranscript(
    @Param('sessionId') sessionId: string,
    @Query('recordingId') recordingId?: string,
    @Query('startTime') startTime?: string,
    @Query('apolloId') apolloId?: string
  ) {
    return this.ringCentralService.getAndSaveCallTranscript(sessionId, recordingId, startTime, apolloId);
  }

  @Post('upload-transcript')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'localAudio', maxCount: 1 },
    { name: 'remoteAudio', maxCount: 1 }
  ]))
  async uploadTranscript(
    @UploadedFiles() files: { localAudio?: any[], remoteAudio?: any[] },
    @Body('sessionId') sessionId: string,
    @Body('startTime') startTime: string,
    @Body('apolloId') apolloId?: string
  ) {
    const localFile = files?.localAudio?.[0];
    const remoteFile = files?.remoteAudio?.[0];
    return this.ringCentralService.transcribeDualUploadedAudio(localFile, remoteFile, sessionId, startTime, apolloId);
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
