import { Injectable, Logger } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  
  generateToken(identity: string): string {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
    
    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      this.logger.error('Missing Twilio credentials in environment variables');
      throw new Error('Twilio credentials not configured');
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true, 
    });

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
    });
    
    token.addGrant(voiceGrant);
    
    return token.toJwt();
  }
}
