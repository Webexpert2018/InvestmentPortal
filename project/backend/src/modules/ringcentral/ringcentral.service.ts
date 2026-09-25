import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { OpenAI, toFile } from 'openai';
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
      this.logger.warn(`Failed to provision via API, attempting to use fallback env variables: ${error.message}`);
      
      const sipUsername = this.configService.get<string>('RINGCENTRAL_SIP_USERNAME');
      const sipPassword = this.configService.get<string>('RINGCENTRAL_SIP_PASSWORD');
      
      if (sipUsername && sipPassword) {
        let domain = this.configService.get<string>('RINGCENTRAL_SIP_DOMAIN') || 'sip.ringcentral.com';
        if (domain.includes(':')) domain = domain.split(':')[0];
        
        let proxy = this.configService.get<string>('RINGCENTRAL_SIP_OUTBOUND_PROXY') || 'sip12.ringcentral.com';
        if (proxy.includes(':')) proxy = proxy.split(':')[0];

        return {
          sipInfo: [{
            transport: 'WSS',
            domain: domain,
            outboundProxy: proxy,
            outboundProxyPort: parseInt(this.configService.get<string>('RINGCENTRAL_SIP_OUTBOUND_PROXY_PORT') || '5096'),
            username: sipUsername,
            password: sipPassword,
            authorizationId: this.configService.get<string>('RINGCENTRAL_SIP_AUTH_ID')
          }]
        };
      }

      this.logger.error(`Error getting SIP provision and no env variables found: ${error.message}`, error.stack);
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

  async getAndSaveCallTranscript(sessionId: string, recordingId?: string, startTime?: string, apolloId?: string) {
    try {
      const existing = await db.query(
        'SELECT transcription_text FROM ringcentral_call_logs WHERE api_session_id = $1',
        [sessionId]
      );
      if (existing.rows.length > 0) {
        const transcriptText = existing.rows[0].transcription_text;
        if (transcriptText.startsWith('Transcription failed') || transcriptText.startsWith('Transcript unavailable')) {
          // It's a cached error, clear it so we can retry
          await db.query('UPDATE ringcentral_call_logs SET transcription_text = NULL WHERE api_session_id = $1', [sessionId]);
        } else {
          return { transcript: transcriptText };
        }
      }

      if (!recordingId) {
        return { transcript: 'No recording available for this call to transcribe.' };
      }

      let transcript = '';

      try {
        const audioBuffer = await this.downloadRecording(recordingId);
        
        const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!openAiApiKey) {
          throw new Error('OPENAI_API_KEY is not configured');
        }

        const openai = new OpenAI({ apiKey: openAiApiKey });
        
        // Convert Buffer to File-like object for OpenAI SDK
        const file = await toFile(audioBuffer, 'recording.mp3', { type: 'audio/mpeg' });

        const result = await openai.audio.transcriptions.create({
          file: file,
          model: 'whisper-1',
          response_format: 'verbose_json',
        });
        
        const callStartDate = startTime ? new Date(startTime) : null;
        const formatTime = (seconds: number) => {
          if (!callStartDate || isNaN(callStartDate.getTime())) return `[${seconds.toFixed(1)}s]`;
          const d = new Date(callStartDate.getTime() + seconds * 1000);
          return `[${d.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} EST]`;
        };

        const segmentsText = (result as any).segments?.map(
          (s: any) => `${formatTime(s.start)} ${s.text}`
        ).join('\n') || result.text;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that formats call transcripts. You will be provided with a transcript where each line has a timestamp and the spoken text. Your task is to analyze the conversation and format it into a clear dialogue.\n\nCRITICAL RULE: You MUST keep the exact timestamp at the beginning of EVERY single line you output. Do not remove the timestamps!\n\nThe caller is an investment representative ("Me"). The receiver is a doctor prospect ("Them"). The caller ("Me") usually initiates the conversation. Use conversational context to determine who is speaking.\n\nFormat each line exactly like this:\n[TIMESTAMP] Me: spoken text\n[TIMESTAMP] Them: spoken text\n\nOutput ONLY the formatted transcript, nothing else.'
            },
            {
              role: 'user',
              content: segmentsText
            }
          ]
        });

        transcript = completion.choices[0].message.content || result.text;

      } catch (e: any) {
        this.logger.error(`Error transcribing with OpenAI: ${e.message}`, e.stack);
        transcript = `Transcription failed.\nReason: ${e.message || 'Unknown error'}\n(Session: ${sessionId})`;
      }

      if (!transcript.startsWith('Transcription failed')) {
        let merged = false;
        if (startTime) {
          const updateRes = await db.query(
            `UPDATE ringcentral_call_logs 
             SET transcription_text = $1, api_session_id = $2, apollo_id = COALESCE(apollo_id, $4)
             WHERE id = (
               SELECT id FROM ringcentral_call_logs 
               WHERE transcription_text IS NULL
               AND start_time IS NOT NULL
               AND ABS(EXTRACT(EPOCH FROM (start_time - $3::timestamptz))) < 120
               ORDER BY ABS(EXTRACT(EPOCH FROM (start_time - $3::timestamptz))) ASC LIMIT 1
             )
             RETURNING id`,
            [transcript, sessionId, startTime, apolloId || null]
          );
          merged = (updateRes.rowCount || 0) > 0;
        } else if (apolloId) {
          const updateRes = await db.query(
            `UPDATE ringcentral_call_logs 
             SET transcription_text = $1, api_session_id = $2
             WHERE id = (
               SELECT id FROM ringcentral_call_logs 
               WHERE apollo_id = $3 AND transcription_text IS NULL
               ORDER BY created_at DESC LIMIT 1
             )
             RETURNING id`,
            [transcript, sessionId, apolloId]
          );
          merged = (updateRes.rowCount || 0) > 0;
        }
        
        if (!merged) {
          await db.query(
            `INSERT INTO ringcentral_call_logs (api_session_id, transcription_text, apollo_id) 
             VALUES ($1, $2, $3)
             ON CONFLICT (api_session_id) DO UPDATE SET 
               transcription_text = EXCLUDED.transcription_text,
               apollo_id = COALESCE(EXCLUDED.apollo_id, ringcentral_call_logs.apollo_id)`,
            [sessionId, transcript, apolloId || null]
          );
        }
      }

      return { transcript };
    } catch (error: any) {
      this.logger.error(`Error with transcript: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get transcript');
    }
  }

  async saveCallLog(data: { sessionId?: string; apolloId: string; phoneNumber: string; duration: number; startTime?: string }) {
    try {
      const { sessionId, apolloId, phoneNumber, duration, startTime } = data;
      await db.query(
        `INSERT INTO ringcentral_call_logs (sip_session_id, apollo_id, phone_number, duration, start_time) 
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId || null, apolloId, phoneNumber, duration, startTime || null]
      );
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error saving local call log: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to save local call log');
    }
  }

  async getInternalLogs() {
    try {
      const res = await db.query(`
        SELECT 
          r.id,
          r.start_time,
          r.duration,
          r.phone_number,
          r.transcription_text,
          r.api_session_id,
          r.apollo_id,
          d.first_name,
          d.last_name
        FROM ringcentral_call_logs r
        LEFT JOIN doctor_prospects d ON r.apollo_id = d.apollo_id
        ORDER BY COALESCE(r.start_time, r.created_at) DESC
        LIMIT 100
      `);
      return res.rows;
    } catch (error: any) {
      this.logger.error(`Error fetching internal call logs: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch internal call logs');
    }
  }
}

