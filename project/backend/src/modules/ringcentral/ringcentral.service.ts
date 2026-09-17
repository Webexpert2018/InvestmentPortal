import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SDK } from '@ringcentral/sdk';
import { ConfigService } from '@nestjs/config';
import { db } from '../../config/database';
@Injectable()
export class RingCentralService {
  private readonly logger = new Logger(RingCentralService.name);
  private rcsdk: SDK;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('RINGCENTRAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('RINGCENTRAL_CLIENT_SECRET');
    // Using production server URL for RingCentral since JWT is likely for production. 
    // If it's a dev JWT, it will throw an error, but let's try production first.
    const serverUrl = 'https://platform.ringcentral.com'; 

    this.rcsdk = new SDK({
      server: serverUrl,
      clientId: clientId,
      clientSecret: clientSecret,
    });
  }

  async getAccessToken() {
    try {
      const jwt = this.configService.get<string>('RINGCENTRAL_JWT');
      if (!jwt) {
        throw new Error('RINGCENTRAL_JWT is not configured');
      }

      const platform = this.rcsdk.platform();
      
      // If already logged in and token is valid, just return it
      if (await platform.loggedIn()) {
        const authData: any = await platform.auth().data();
        return {
          access_token: authData.access_token,
          expires_in: authData.expires_in,
          endpoint: (this.rcsdk.platform() as any)._server,
        };
      }

      // Otherwise, login using JWT
      const response = await platform.login({ jwt });
      const authData: any = await response.json();

      return {
        access_token: authData.access_token,
        expires_in: authData.expires_in,
        endpoint: (this.rcsdk.platform() as any)._server,
      };
    } catch (error: any) {
      this.logger.error(`Error authenticating with RingCentral: ${error.message}`, error.stack);
      
      // Fallback: Check if they provided devtest JWT instead of prod
      if (error.message.includes('OAU-105') || error.message.includes('unauthorized_client')) {
        this.logger.error("Possible mismatch between JWT environment and Server URL.");
      }
      
      throw new InternalServerErrorException('Failed to authenticate with RingCentral');
    }
  }

  async getSipProvision() {
    try {
      const platform = this.rcsdk.platform();
      // Ensure logged in
      if (!(await platform.loggedIn())) {
        await this.getAccessToken();
      }

      // Get SIP provisioning info for the web phone
      const res = await platform.post('/restapi/v1.0/client-info/sip-provision', {
        sipInfo: [{ transport: 'WSS' }]
      });
      return await res.json();
    } catch (error: any) {
      this.logger.error(`Error getting SIP provision: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to provision SIP device');
    }
  }

  async getRecentCallLogs() {
    try {
      const platform = this.rcsdk.platform();
      if (!(await platform.loggedIn())) await this.getAccessToken();

      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 7);
      
      const res = await platform.get('/restapi/v1.0/account/~/extension/~/call-log', {
        dateFrom: dateFrom.toISOString(),
        view: 'Detailed',
        perPage: 20
      });
      return await res.json();
    } catch (error: any) {
      this.logger.error(`Error getting call logs: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch call logs');
    }
  }

  async downloadRecording(recordingId: string) {
    try {
      const platform = this.rcsdk.platform();
      if (!(await platform.loggedIn())) await this.getAccessToken();

      const res = await platform.get(`/restapi/v1.0/account/~/recording/${recordingId}/content`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error: any) {
      this.logger.error(`Error downloading recording: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to download recording');
    }
  }

  async getAndSaveCallTranscript(sessionId: string) {
    try {
      const existing = await db.query(
        'SELECT transcription_text FROM ringcentral_call_transcripts WHERE session_id = $1',
        [sessionId]
      );
      if (existing.rows.length > 0) {
        return { transcript: existing.rows[0].transcription_text };
      }

      const platform = this.rcsdk.platform();
      if (!(await platform.loggedIn())) await this.getAccessToken();

      let transcript = '';
      
      try {
        // Attempt to fetch from RingCentral AI endpoint
        const res = await platform.get(`/ai/ringsense/v1/public/accounts/~/domains/pbx/sessions/${sessionId}/insights?insightTypes=Transcript`);
        const data: any = await res.json();
        
        let insightsSource: any = null;
        if (data) {
          if (Array.isArray(data) && data.length > 0) insightsSource = data[0].insights;
          else if (data.records && Array.isArray(data.records) && data.records.length > 0) insightsSource = data.records[0].insights;
          else if (data.insights) insightsSource = data.insights;
        }
        
        if (insightsSource) {
           if (Array.isArray(insightsSource)) {
             const transcriptInsight = insightsSource.find((i: any) => i.insightType === 'Transcript' || i.name === 'Transcript' || i.type === 'Transcript');
             if (transcriptInsight && transcriptInsight.utterances) {
                transcript = transcriptInsight.utterances.map((u: any) => `${u.speakerId || 'Speaker'}: ${u.text}`).join('\n');
             }
           } else if (insightsSource.Transcript && insightsSource.Transcript.utterances) {
              transcript = insightsSource.Transcript.utterances.map((u: any) => `${u.speakerId || 'Speaker'}: ${u.text}`).join('\n');
           }
        }
        
        if (!transcript) {
           // Dump the shape of the data if we couldn't parse it
           const rawData = JSON.stringify(data).substring(0, 200);
           transcript = `AI Processing not complete or Transcript unavailable for Session ${sessionId}.\n\nRaw API Response: ${rawData}`;
        }
      } catch (e: any) {
        let errMsg = e.message || 'Unknown error';
        if (errMsg.includes('InsufficientPermissions') || errMsg.includes('403')) {
          errMsg = 'RingSense permissions not enabled on your app, or AI add-on missing from your account.';
        }
        transcript = `Transcript unavailable natively.\nReason: ${errMsg}\n(Session: ${sessionId})`;
      }

      await db.query(
        `INSERT INTO ringcentral_call_transcripts (session_id, transcription_text) 
         VALUES ($1, $2)
         ON CONFLICT (session_id) DO UPDATE SET transcription_text = EXCLUDED.transcription_text`,
        [sessionId, transcript]
      );

      return { transcript };
    } catch (error: any) {
      this.logger.error(`Error with transcript: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get transcript');
    }
  }
}
