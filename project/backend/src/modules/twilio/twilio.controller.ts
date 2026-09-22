import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { Request, Response } from 'express';
import * as twilio from 'twilio';
import { TwilioGateway } from './twilio.gateway';

@Controller('twilio')
export class TwilioController {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly twilioGateway: TwilioGateway,
  ) { }

  @Get('token')
  getToken(@Req() req: Request) {
    const identity = req.query.identity as string || 'user_frontend';
    const token = this.twilioService.generateToken(identity);
    return { token, identity };
  }

  @Post('twiml')
  async generateTwiML(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    const to = body.To;
    const from = process.env.TWILIO_PHONE_NUMBER;
    const callSid = body.CallSid;

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    // Start real-time transcription
    const start = response.start();
    start.transcription({
      name: 'live_transcription',
      track: 'both_tracks',
      statusCallbackUrl: `${reqProtocol(req)}/twilio/transcription-callback`,
    });

    const dial = response.dial({ callerId: from });

    // Twilio Voice SDK formats 'To' as 'client:name' or real phone number
    if (to) {
      const isClient = /^client:/.test(to);
      if (isClient) {
        dial.client(to.replace('client:', ''));
      } else {
        dial.number(to);
      }
    } else {
      dial.number('+18005551212'); // fallback
    }

    res.set('Content-Type', 'text/xml');
    res.send(response.toString());
  }

  // @Post('transcription-callback')
  // async handleTranscriptionCallback(@Body() body: any, @Res() res: Response) {
  //   if (body.TranscriptionEvent === 'transcription-started') {
  //     console.log('TRANSCRIPTION STARTED for CallSid:', body.CallSid);
  //   } else if (body.TranscriptionEvent === 'transcription-error') {
  //     console.error('TRANSCRIPTION ERROR:', body);
  //   } else if (body.TranscriptionEvent === 'transcription-content') {
  //     console.log('TRANSCRIPTION CONTENT:', body.TranscriptionData);
  //     const parsedData = body.TranscriptionData ? JSON.parse(body.TranscriptionData) : null;
  //     const text = parsedData ? parsedData.transcript : '';
  //     const track = body.Track || 'unknown';
  //     const callSid = body.CallSid;

  //     if (text) {
  //       // Emit via Socket.IO to the frontend
  //       this.twilioGateway.broadcastTranscription(callSid, text, track);
  //     }
  //   }

  //   res.status(200).send('OK');
  // }
  @Post('transcription-callback')
  async handleTranscriptionCallback(@Body() body: any, @Res() res: Response) {
    if (body.TranscriptionEvent === 'transcription-error') {
      console.error('TRANSCRIPTION ERROR:', body.Track, body);
    } else if (body.TranscriptionEvent === 'transcription-content') {
      const parsedData = body.TranscriptionData ? JSON.parse(body.TranscriptionData) : null;
      const text = parsedData ? parsedData.transcript : '';
      const track = body.Track || 'unknown';
      const callSid = body.CallSid;

      if (text) {
        this.twilioGateway.broadcastTranscription(callSid, text, track);
      }
    }

    res.status(200).send('OK');
  }
}

function reqProtocol(req: Request): string {
  // Use x-forwarded headers from ngrok/localtunnel if available
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
}
