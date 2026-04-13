import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as docusign from 'docusign-esign';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

/**
 * DocuSign Service handles the interaction with DocuSign eSignature API.
 */
@Injectable()
export class DocusignService {
  private readonly logger = new Logger(DocusignService.name);
  private dsApiClient: docusign.ApiClient;

  constructor(private configService: ConfigService) {
    this.dsApiClient = new docusign.ApiClient();
    const accountBaseUrl = this.configService.get<string>('DOCUSIGN_BASE_URL') || 'https://account-d.docusign.com';
    this.dsApiClient.setOAuthBasePath(accountBaseUrl.replace('https://', ''));

    const apiBase = this.configService.get<string>('DOCUSIGN_API_BASE') || 'https://demo.docusign.net/restapi';
    this.dsApiClient.setBasePath(apiBase);
  }

  /**
   * Gets a JWT-based access token for the system account.
   */
  async getAccessTokenJWT(): Promise<{ accessToken: string; accountId: string }> {
    const clientId = this.configService.get<string>('DOCUSIGN_CLIENT_ID');
    const impersonatedUserId = this.configService.get<string>('DOCUSIGN_IMPERSONATED_USER_ID');
    let privateKey = this.configService.get<string>('DOCUSIGN_PRIVATE_KEY');

    if (!clientId || !impersonatedUserId || !privateKey) {
      const missing = [];
      if (!clientId) missing.push('DOCUSIGN_CLIENT_ID');
      if (!impersonatedUserId) missing.push('DOCUSIGN_IMPERSONATED_USER_ID');
      if (!privateKey) missing.push('DOCUSIGN_PRIVATE_KEY');
      
      throw new Error(`Missing required DocuSign configuration in .env: ${missing.join(', ')}. Please ensure these are uncommented and have valid values.`);
    }
    
    // Remove quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    
    // Handle literal \n and ensuring proper PEM format
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    const scopes = [
      docusign.ApiClient.OAuth.Scope.SIGNATURE,
      docusign.ApiClient.OAuth.Scope.IMPERSONATION,
    ];

    try {
      this.logger.log(`Requesting JWT token for DocuSign User: ${impersonatedUserId}`);
      this.logger.debug(`Using ClientID: ${clientId}`);
      
      const results = await this.dsApiClient.requestJWTUserToken(
        clientId,
        impersonatedUserId,
        scopes,
        Buffer.from(privateKey),
        3600
      );

      const accessToken = results.body.access_token;
      this.dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);

      const userInfo = await this.dsApiClient.getUserInfo(accessToken);
      const account = userInfo.accounts[0]; // Assuming primary account

      this.dsApiClient.setBasePath(`${account.baseUri}/restapi`);

      return {
        accessToken,
        accountId: account.accountId
      };
    } catch (error: any) {
      const errorBody = error.response?.body || error.response?.data;
      const errorMessage = error.message;
      
      if (errorBody?.error === 'consent_required') {
        const authBaseUrl = this.configService.get<string>('DOCUSIGN_BASE_URL') || 'https://account-d.docusign.com';
        const redirectUri = this.configService.get<string>('DOCUSIGN_REDIRECT_URI')!;
        const consentUrl = `${authBaseUrl}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${clientId}&redirect_uri=${redirectUri}`;
        
        this.logger.error('DocuSign JWT Error: Consent required. Please visit this URL to grant consent:');
        this.logger.error(consentUrl);
        
        throw new Error(`Consent required. Please visit: ${consentUrl}`);
      }

      this.logger.error('Error requesting DocuSign JWT token:', errorBody || errorMessage);
      if (errorBody) {
        this.logger.error('Full Error Body:', JSON.stringify(errorBody, null, 2));
      }
      throw error;
    }
  }

  /**
   * Generates the URL for User Authorization.
   */
  getAuthUrl(): string {
    const clientId = this.configService.get<string>('DOCUSIGN_CLIENT_ID')!;
    const redirectUri = this.configService.get<string>('DOCUSIGN_REDIRECT_URI')!;
    const scopes = [
      docusign.ApiClient.OAuth.Scope.SIGNATURE,
      docusign.ApiClient.OAuth.Scope.EXTENDED,
    ];

    return this.dsApiClient.getAuthorizationUri(
      clientId,
      scopes,
      redirectUri,
      'code',
      'state-identifier'
    );
  }

  /**
   * Exchanges the authorization code for an access token.
   */
  async handleCallback(code: string) {
    const clientId = this.configService.get<string>('DOCUSIGN_CLIENT_ID')!;
    const clientSecret = this.configService.get<string>('DOCUSIGN_CLIENT_SECRET')!;
    const redirectUri = this.configService.get<string>('DOCUSIGN_REDIRECT_URI')!;
    const authBaseUrl = this.configService.get<string>('DOCUSIGN_BASE_URL')!;

    try {
      const url = `${authBaseUrl}/oauth/token`;
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', redirectUri);

      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await axios.post(url, params.toString(), {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenResponse = response.data;

      this.dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + tokenResponse.access_token);

      const userInfo = await this.dsApiClient.getUserInfo(tokenResponse.access_token);
      const account = userInfo.accounts[0];

      this.dsApiClient.setBasePath(`${account.baseUri}/restapi`);

      return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        accountId: account.accountId,
        baseUri: account.baseUri,
        userName: userInfo.name,
        email: userInfo.email,
        allAccounts: userInfo.accounts
      };
    } catch (error: any) {
      this.logger.error('Error exchanging DocuSign code for token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Creates a sample envelope and returns the embedded signing URL.
   */
  async createSampleEnvelope(
    accessToken: string,
    accountId: string,
    signerEmail: string,
    signerName: string,
    documentData: { filename: string, content?: string }
  ) {
    return this.createEnvelopeForInvestment(
      accessToken,
      accountId,
      signerEmail,
      signerName,
      'Test Fund',
      10000,
      this.configService.get<string>('FRONTEND_URL')! + '/dashboard/funds?signing=complete'
    );
  }

  /**
   * Creates an envelope for a specific investment and returns the embedded signing URL.
   */
  async createEnvelopeForInvestment(
    accessToken: string | null,
    accountId: string | null,
    signerEmail: string,
    signerName: string,
    fundName: string,
    investmentAmount: number,
    returnUrl: string
  ) {
    // If no token provided, use JWT system auth
    if (!accessToken || !accountId) {
      const auth = await this.getAccessTokenJWT();
      accessToken = auth.accessToken;
      accountId = auth.accountId;
    }

    this.dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);

    // Use any to avoid lint errors with mismatching @types/docusign-esign
    const ds = docusign as any;
    const envelopesApi = new ds.EnvelopesApi(this.dsApiClient);

    const safeFundName = fundName.replace(/[^a-z0-9]/gi, '-');
    const docPaths = [
      { name: 'Operating Agreement', filename: `OA-${safeFundName}.pdf`, id: '1' },
      { name: 'Subscription Agreement', filename: `SA-${safeFundName}.pdf`, id: '2' }
    ];

    // Default fallbacks if fund-specific files are missing
    const defaultDocPaths = [
      { name: 'Operating Agreement', filename: 'OA-BWell-Fund.pdf', id: '1' },
      { name: 'Subscription Agreement', filename: 'SA-BWell-Fund.pdf', id: '2' }
    ];

    const documents = docPaths.map((docInfo, index) => {
      // Possible path locations on Vercel and Local
      const pathsToTry = [
        path.resolve(process.cwd(), 'public/subscription-documents', docInfo.filename),
        path.resolve(__dirname, '..', '..', '..', 'public/subscription-documents', docInfo.filename),
        // Try default fallback if specific fund doc is missing
        path.resolve(process.cwd(), 'public/subscription-documents', defaultDocPaths[index].filename),
        path.resolve(__dirname, '..', '..', '..', 'public/subscription-documents', defaultDocPaths[index].filename)
      ];

      let filePath = pathsToTry[0];
      let found = false;

      for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
          filePath = p;
          found = true;
          break;
        }
      }

      let docBase64: string;
      if (found) {
        this.logger.log(`Using document from ${filePath}`);
        docBase64 = fs.readFileSync(filePath).toString('base64');
      } else {
        this.logger.warn(`Document not found for ${fundName} (searched ${pathsToTry.join(', ')}), using placeholder.`);
        docBase64 = Buffer.from(`${docInfo.name} Content for ${fundName}`).toString('base64');
      }

      const doc = new ds.Document();
      doc.documentBase64 = docBase64;
      doc.name = docInfo.name;
      doc.fileExtension = fs.existsSync(filePath) ? 'pdf' : 'txt';
      doc.documentId = docInfo.id;
      return doc;
    });

    // --- Create Tabs for Signer ---
    // Surgical anchoring based on provided screenshots to avoid Company/Operating Member sections.

    // 1. OA First Page Name
    const startNameTab = new ds.Text();
    startNameTab.anchorString = '(the "Investor Member"';
    startNameTab.anchorUnits = 'pixels';
    startNameTab.anchorXOffset = '-200'; // Position on the blank line to the left
    startNameTab.anchorYOffset = '0';
    startNameTab.value = signerName;
    startNameTab.tabLabel = 'Initial Investor Name';
    startNameTab.locked = 'true';
    startNameTab.documentId = '1';
    startNameTab.recipientId = '1';

    // 2. SA Signature Block (Anchored to "INVESTOR:")
    const saSignature = new ds.SignHere();
    saSignature.anchorString = 'INVESTOR:';
    saSignature.anchorUnits = 'pixels';
    saSignature.anchorXOffset = '100';
    saSignature.anchorYOffset = '55'; // 2 lines down
    saSignature.anchorMatchWholeWord = 'true';
    saSignature.documentId = '2';
    saSignature.recipientId = '1';

    const saAmount = new ds.Text();
    saAmount.anchorString = 'INVESTOR:';
    saAmount.anchorUnits = 'pixels';
    saAmount.anchorXOffset = '120';
    saAmount.anchorYOffset = '22'; // 1 line down
    saAmount.value = `$${investmentAmount.toLocaleString('en-US')}`;
    saAmount.tabLabel = 'Investment Amount';
    saAmount.locked = 'true';
    saAmount.documentId = '2';
    saAmount.recipientId = '1';

    const saName = new ds.Text();
    saName.anchorString = 'INVESTOR:';
    saName.anchorUnits = 'pixels';
    saName.anchorXOffset = '80';
    saName.anchorYOffset = '88'; // 3 lines down
    saName.value = signerName;
    saName.tabLabel = 'SA Investor Name';
    saName.locked = 'true';
    saName.documentId = '2';
    saName.recipientId = '1';

    const saDate = new ds.DateSigned();
    saDate.anchorString = 'INVESTOR:';
    saDate.anchorUnits = 'pixels';
    saDate.anchorXOffset = '80';
    saDate.anchorYOffset = '122'; // 4 lines down
    saDate.anchorMatchWholeWord = 'true';
    saDate.documentId = '2';
    saDate.recipientId = '1';

    // 3. OA Signature Block (Anchored to "INVESTOR MEMBER:")
    const oaSignature = new ds.SignHere();
    oaSignature.anchorString = 'INVESTOR MEMBER:';
    oaSignature.anchorUnits = 'pixels';
    oaSignature.anchorXOffset = '100';
    oaSignature.anchorYOffset = '25'; // 1 line down
    oaSignature.anchorMatchWholeWord = 'true';
    oaSignature.documentId = '1';
    oaSignature.recipientId = '1';

    const oaDate = new ds.DateSigned();
    oaDate.anchorString = 'INVESTOR MEMBER:';
    oaDate.anchorUnits = 'pixels';
    oaDate.anchorXOffset = '80';
    oaDate.anchorYOffset = '65'; // 2 lines down
    oaDate.anchorMatchWholeWord = 'true';
    oaDate.documentId = '1';
    oaDate.recipientId = '1';

    const oaName = new ds.Text();
    oaName.anchorString = 'INVESTOR MEMBER:';
    oaName.anchorUnits = 'pixels';
    oaName.anchorXOffset = '80';
    oaName.anchorYOffset = '105'; // 3 lines down
    oaName.value = signerName;
    oaName.tabLabel = 'OA Investor Name';
    oaName.locked = 'true';
    oaName.documentId = '1';
    oaName.recipientId = '1';

    const tabs = new ds.Tabs();
    tabs.signHereTabs = [saSignature, oaSignature];
    tabs.dateSignedTabs = [saDate, oaDate];
    tabs.textTabs = [startNameTab, saAmount, saName, oaName];

    const signer = new ds.Signer();
    signer.email = signerEmail;
    signer.name = signerName;
    signer.recipientId = '1';
    signer.clientUserId = '1001';
    signer.tabs = tabs;

    const env = new ds.EnvelopeDefinition();
    env.emailSubject = `Please sign the Subscription Documents for ${fundName}`;
    env.documents = documents;
    env.recipients = new ds.Recipients();
    env.recipients.signers = [signer];
    env.status = 'sent';

    try {
      const results = await envelopesApi.createEnvelope(accountId, { envelopeDefinition: env });
      const envelopeId = results.envelopeId;

      const viewRequest = new ds.RecipientViewRequest();
      viewRequest.returnUrl = returnUrl;
      viewRequest.authenticationMethod = 'none';
      viewRequest.email = signerEmail;
      viewRequest.userName = signerName;
      viewRequest.clientUserId = '1001';

      const viewResults = await envelopesApi.createRecipientView(accountId, envelopeId, { recipientViewRequest: viewRequest });

      return {
        envelopeId,
        signingUrl: viewResults.url,
      };
    } catch (error: any) {
      const detailedError = error.response?.body || error.response?.data || error.message;
      this.logger.error('Error creating DocuSign envelope:', detailedError);
      if (error.response?.body) {
        this.logger.error('Full DocuSign Error Body:', JSON.stringify(error.response.body, null, 2));
      }
      throw error;
    }
  }

  /**
   * Fetches the combined PDF for a given envelope.
   */
  async getEnvelopeDocument(accessToken: string, accountId: string, envelopeId: string) {
    this.dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    const ds = docusign as any;
    const envelopesApi = new ds.EnvelopesApi(this.dsApiClient);

    try {
      // documentId 'combined' returns everything as one PDF
      const results = await envelopesApi.getDocument(accountId, envelopeId, 'combined');
      // The SDK returns the document content as a string/buffer
      return results;
    } catch (error: any) {
      this.logger.error('Error fetching DocuSign document:', error.response?.body || error.message);
      throw error;
    }
  }
}
