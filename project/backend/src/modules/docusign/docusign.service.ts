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
    const accountBaseUrl = this.configService.get<string>('DOCUSIGN_BASE_URL');
    if (accountBaseUrl) {
      this.dsApiClient.setOAuthBasePath(accountBaseUrl.replace('https://', ''));
    }
    const apiBase = this.configService.get<string>('DOCUSIGN_API_BASE');
    if (apiBase) {
      this.dsApiClient.setBasePath(apiBase);
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
    accessToken: string,
    accountId: string,
    signerEmail: string,
    signerName: string,
    fundName: string,
    investmentAmount: number,
    returnUrl: string
  ) {
    this.dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);

    // Use any to avoid lint errors with mismatching @types/docusign-esign
    const ds = docusign as any;
    const envelopesApi = new ds.EnvelopesApi(this.dsApiClient);

    const docPaths = [
      { name: 'Operating Agreement', filename: 'OA-BWell-Fund.pdf', id: '1' },
      { name: 'Subscription Agreement', filename: 'SA-BWell-Fund.pdf', id: '2' }
    ];

    const documents = docPaths.map(docInfo => {
      const filePath = path.resolve(process.cwd(), 'public/subscription-documents', docInfo.filename);
      let docBase64: string;
      if (fs.existsSync(filePath)) {
        docBase64 = fs.readFileSync(filePath).toString('base64');
      } else {
        this.logger.warn(`Document not found at ${filePath}, using placeholder.`);
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

    // 1. Signature Tabs (Primary: /sn1/, Fallbacks: Signature:)
    const signHere1 = new ds.SignHere();
    signHere1.anchorString = '/sn1/';
    signHere1.anchorUnits = 'pixels';
    signHere1.anchorXOffset = '20';
    signHere1.anchorYOffset = '-10';
    signHere1.documentId = '1';
    signHere1.recipientId = '1';

    const signHere2 = new ds.SignHere();
    signHere2.anchorString = '/sn1/';
    signHere2.anchorUnits = 'pixels';
    signHere2.anchorXOffset = '20';
    signHere2.anchorYOffset = '-10';
    signHere2.documentId = '2';
    signHere2.recipientId = '1';

    // Fallback signature for "Signature:" label
    const signHereFallback = new ds.SignHere();
    signHereFallback.anchorString = 'Signature:';
    signHereFallback.anchorUnits = 'pixels';
    signHereFallback.anchorXOffset = '50';
    signHereFallback.anchorYOffset = '-10';
    signHereFallback.recipientId = '1';

    // 2. Date Tabs (Primary: /ds1/, Fallbacks: Date:, Dated:)
    const dateSigned1 = new ds.DateSigned();
    dateSigned1.anchorString = '/ds1/';
    dateSigned1.anchorUnits = 'pixels';
    dateSigned1.anchorXOffset = '0';
    dateSigned1.anchorYOffset = '3';
    dateSigned1.documentId = '1';
    dateSigned1.recipientId = '1';

    const dateSigned2 = new ds.DateSigned();
    dateSigned2.anchorString = '/ds1/';
    dateSigned2.anchorUnits = 'pixels';
    dateSigned2.anchorXOffset = '0';
    dateSigned2.anchorYOffset = '3';
    dateSigned2.documentId = '2';
    dateSigned2.recipientId = '1';

    const dateFallback = new ds.Text();
    dateFallback.anchorString = 'Date:';
    dateFallback.anchorUnits = 'pixels';
    dateFallback.anchorXOffset = '50';
    dateFallback.anchorYOffset = '3';
    dateFallback.value = new Date().toLocaleDateString('en-US');
    dateFallback.tabLabel = 'Date Fallback 1';
    dateFallback.locked = 'true';
    dateFallback.recipientId = '1';

    const datedFallback = new ds.Text();
    datedFallback.anchorString = 'Dated:';
    datedFallback.anchorUnits = 'pixels';
    datedFallback.anchorXOffset = '60';
    datedFallback.anchorYOffset = '3';
    datedFallback.value = new Date().toLocaleDateString('en-US');
    datedFallback.tabLabel = 'Date Fallback 2';
    datedFallback.locked = 'true';
    datedFallback.recipientId = '1';

    // 3. Name Tabs (Primary: /nm1/, Fallbacks: Name:)
    const nameTab = new ds.Text();
    nameTab.anchorString = '/nm1/';
    nameTab.anchorUnits = 'pixels';
    nameTab.anchorXOffset = '0';
    nameTab.anchorYOffset = '4';
    nameTab.value = signerName;
    nameTab.tabLabel = 'Investor Name';
    nameTab.locked = 'true';
    nameTab.documentId = '1';
    nameTab.recipientId = '1';

    const nameTab2 = new ds.Text();
    nameTab2.anchorString = '/nm1/';
    nameTab2.anchorUnits = 'pixels';
    nameTab2.anchorXOffset = '0';
    nameTab2.anchorYOffset = '4';
    nameTab2.value = signerName;
    nameTab2.tabLabel = 'Investor Name 2';
    nameTab2.locked = 'true';
    nameTab2.documentId = '2';
    nameTab2.recipientId = '1';

    const nameFallback = new ds.Text();
    nameFallback.anchorString = 'Name:';
    nameFallback.anchorUnits = 'pixels';
    nameFallback.anchorXOffset = '60';
    nameFallback.anchorYOffset = '4';
    nameFallback.value = signerName;
    nameFallback.tabLabel = 'Investor Name Fallback';
    nameFallback.locked = 'true';
    nameFallback.recipientId = '1';

    // 3. Amount Tab (Auto-fill for SA, Anchor string: /am1/)
    const amountTab = new ds.Text();
    amountTab.anchorString = '/am1/';
    amountTab.anchorUnits = 'pixels';
    amountTab.anchorXOffset = '0';
    amountTab.anchorYOffset = '4';
    amountTab.value = `$${investmentAmount.toLocaleString('en-US')}`;
    amountTab.tabLabel = 'Investment Amount';
    amountTab.locked = 'true';
    amountTab.documentId = '2';
    amountTab.recipientId = '1';

    // 4. Additional Fallbacks (but restricted to Avoid Overlaps)
    // We only use text fallbacks if the specific anchors fail, 
    // but we use larger X offsets to avoid the labels themselves.
    const amountFallback = new ds.Text();
    amountFallback.anchorString = 'Amount Invested:';
    amountFallback.anchorUnits = 'pixels';
    amountFallback.anchorXOffset = '110';
    amountFallback.anchorYOffset = '4';
    amountFallback.value = `$${investmentAmount.toLocaleString('en-US')}`;
    amountFallback.tabLabel = 'Investment Amount Fallback';
    amountFallback.locked = 'true';
    amountFallback.documentId = '2';
    amountFallback.recipientId = '1';

    const tabs = new ds.Tabs();
    tabs.signHereTabs = [signHere1, signHere2, signHereFallback];
    tabs.dateSignedTabs = [dateSigned1, dateSigned2];
    tabs.textTabs = [nameTab, nameTab2, nameFallback, amountTab, amountFallback, dateFallback, datedFallback];

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
