import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SDK } from '@ringcentral/sdk';
import { ConfigService } from '@nestjs/config';

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
}
