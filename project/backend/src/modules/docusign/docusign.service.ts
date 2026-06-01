import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as docusign from 'docusign-esign';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { db } from '../../config/database';

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
    returnUrl: string,
    fundId?: string
  ) {
    // If no token provided, use JWT system auth
    if (!accessToken || !accountId) {
      const auth = await this.getAccessTokenJWT();
      accessToken = auth.accessToken;
      accountId = auth.accountId;
    }

    this.dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);

    // Fetch fund details to see if we have custom subscription documents and anchors
    let fund: any = null;
    try {
      if (fundId) {
        const res = await db.query('SELECT * FROM funds WHERE id = $1', [fundId]);
        fund = res.rows[0];
      } else {
        const res = await db.query('SELECT * FROM funds WHERE name = $1', [fundName]);
        fund = res.rows[0];
      }
    } catch (dbErr) {
      this.logger.error('Failed to query fund details from database', dbErr);
    }

    // Parse names for IRA/Entity accounts
    let documentName = signerName;
    let signatureName = signerName;

    if (signerName.toLowerCase().includes('fbo')) {
      const fboIndex = signerName.toUpperCase().indexOf('FBO');
      if (fboIndex !== -1) {
        // 1. For the document: Replace everything before FBO with AET
        documentName = 'AET ' + signerName.substring(fboIndex);
        
        // 2. For signature: Extract only the full name of the investor
        let afterFbo = signerName.substring(fboIndex + 3).trim();
        afterFbo = afterFbo.replace(/\s+(Defined Benefit Plan|DB Plan|Traditional IRA|Traditional|Roth IRA|Roth SEP|SEP IRA|Roth|SEP|IRA|401k|Account)$/i, '').trim();
        signatureName = afterFbo;
      }
    } else {
      signatureName = signerName.replace(/\s+(Defined Benefit Plan|DB Plan|Traditional IRA|Traditional|Roth IRA|Roth SEP|SEP IRA|Roth|SEP|IRA|401k|Account)$/i, '').trim();
    }

    // Use any to avoid lint errors with mismatching @types/docusign-esign
    const ds = docusign as any;
    const envelopesApi = new ds.EnvelopesApi(this.dsApiClient);

    const safeFundName = fundName.replace(/[^a-z0-9]/gi, '-');
    let docPaths = [];
    let defaultDocPaths = [];
    let isCustomDoc = false;

    if (fund && fund.subscription_doc_path) {
      isCustomDoc = true;
      docPaths = [
        { name: 'Subscription Agreement', filename: fund.subscription_doc_path, id: '1' }
      ];
      defaultDocPaths = [
        { name: 'Subscription Agreement', filename: fund.subscription_doc_path, id: '1' }
      ];
    } else {
      docPaths = [
        { name: 'Operating Agreement', filename: `OA-${safeFundName}.pdf`, id: '1' },
        { name: 'Subscription Agreement', filename: `SA-${safeFundName}.pdf`, id: '2' }
      ];
      defaultDocPaths = [
        { name: 'Operating Agreement', filename: 'OA-BWell-Fund.pdf', id: '1' },
        { name: 'Subscription Agreement', filename: 'SA-BWell-Fund.pdf', id: '2' }
      ];
    }

    const documents = await Promise.all(
      docPaths.map(async (docInfo, index) => {
        let docBase64: string;
        let fileExtension = 'pdf';

        if (docInfo.filename.startsWith('http://') || docInfo.filename.startsWith('https://')) {
          this.logger.log(`Using custom cloud document: ${docInfo.filename}`);
          try {
            const response = await axios.get(docInfo.filename, { responseType: 'arraybuffer' });
            docBase64 = Buffer.from(response.data).toString('base64');
            fileExtension = 'pdf';
          } catch (downloadErr: any) {
            this.logger.error(`Failed to download custom document from ${docInfo.filename}`, downloadErr);
            docBase64 = Buffer.from(`${docInfo.name} Content for ${fundName}`).toString('base64');
            fileExtension = 'txt';
          }
        } else {
          // Possible path locations on Vercel and Local
          const pathsToTry = [
            path.resolve(process.cwd(), 'public/subscription-documents', docInfo.filename),
            path.resolve(__dirname, '..', '..', '..', 'public/subscription-documents', docInfo.filename)
          ];

          // Add fallback only if it's NOT a custom document
          if (!isCustomDoc && defaultDocPaths[index]) {
            pathsToTry.push(
              path.resolve(process.cwd(), 'public/subscription-documents', defaultDocPaths[index].filename),
              path.resolve(__dirname, '..', '..', '..', 'public/subscription-documents', defaultDocPaths[index].filename)
            );
          }

          let filePath = pathsToTry[0];
          let found = false;

          for (const p of pathsToTry) {
            if (fs.existsSync(p)) {
              filePath = p;
              found = true;
              break;
            }
          }

          if (found) {
            this.logger.log(`Using document from ${filePath}`);
            docBase64 = fs.readFileSync(filePath).toString('base64');
            fileExtension = 'pdf';
          } else {
            this.logger.warn(`Document not found for ${fundName} (searched ${pathsToTry.join(', ')}), using placeholder.`);
            docBase64 = Buffer.from(`${docInfo.name} Content for ${fundName}`).toString('base64');
            fileExtension = 'txt';
          }
        }

        const doc = new ds.Document();
        doc.documentBase64 = docBase64;
        doc.name = docInfo.name;
        doc.fileExtension = fileExtension;
        doc.documentId = docInfo.id;
        return doc;
      })
    );

    // --- Create Tabs for Signer ---
    const tabs = new ds.Tabs();

    if (isCustomDoc && fund) {
      const signHereTabs: any[] = [];
      const textTabs: any[] = [];

      if (fund.placements && Array.isArray(fund.placements) && fund.placements.length > 0) {
        this.logger.log(`Mapping ${fund.placements.length} custom placements for fund.`);
        
        fund.placements.forEach((placement: any, idx: number) => {
          const pageStr = placement.page.toString();
          
          // Convert percentages back to DocuSign pixels.
          // Standard DocuSign coordinate grid assumes default PDF coordinates (usually standard Letter size 612x792).
          const width = 612;
          const height = 792;

          if (placement.type === 'signature') {
            const sig = new ds.SignHere();
            sig.pageNumber = pageStr;
            // Offset signature tab (default width ~80px, height ~30px) to center it on the clicked coordinate
            const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 40);
            const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 15);
            sig.xPosition = adjustedX.toString();
            sig.yPosition = adjustedY.toString();
            sig.documentId = '1';
            sig.recipientId = '1';
            sig.tabLabel = `Signature_${idx + 1}`;
            signHereTabs.push(sig);
          } else if (placement.type === 'name') {
            const nameTab = new ds.Text();
            nameTab.pageNumber = pageStr;
            // Offset text tab (default width ~120px, height ~20px) to center it on the clicked coordinate
            const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 60);
            const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
            nameTab.xPosition = adjustedX.toString();
            nameTab.yPosition = adjustedY.toString();
            nameTab.value = documentName;
            nameTab.font = 'TimesNewRoman';
            nameTab.fontSize = 'Size11';
            nameTab.tabLabel = `InvestorName_${idx + 1}`;
            nameTab.locked = 'true';
            nameTab.documentId = '1';
            nameTab.recipientId = '1';
            textTabs.push(nameTab);
          } else if (placement.type === 'amount') {
            const amountTab = new ds.Text();
            amountTab.pageNumber = pageStr;
            // Offset text tab (default width ~100px, height ~20px) to center it on the clicked coordinate
            const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 50);
            const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
            amountTab.xPosition = adjustedX.toString();
            amountTab.yPosition = adjustedY.toString();
            amountTab.value = `$${investmentAmount.toLocaleString('en-US')}`;
            amountTab.font = 'TimesNewRoman';
            amountTab.fontSize = 'Size11';
            amountTab.tabLabel = `InvestmentAmount_${idx + 1}`;
            amountTab.locked = 'true';
            amountTab.documentId = '1';
            amountTab.recipientId = '1';
            textTabs.push(amountTab);
          } else if (placement.type === 'date') {
            const dateTab = new ds.Text();
            dateTab.pageNumber = pageStr;
            // Offset text tab (default width ~100px, height ~20px) to center it on the clicked coordinate
            const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 50);
            const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
            dateTab.xPosition = adjustedX.toString();
            dateTab.yPosition = adjustedY.toString();
            dateTab.value = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
            dateTab.font = 'TimesNewRoman';
            dateTab.fontSize = 'Size11';
            dateTab.tabLabel = `DateSigned_${idx + 1}`;
            dateTab.locked = 'true';
            dateTab.documentId = '1';
            dateTab.recipientId = '1';
            textTabs.push(dateTab);
          }
        });
      } else {
        // Create tabs dynamically using configured anchor tags or absolute coordinates
        const nameAnchor = fund.anchor_name || '{{NAME}}';
        const dateAnchor = fund.anchor_date || '{{DATE}}';
        const signatureAnchor = fund.anchor_signature || '{{SIGNATURE}}';
        const amountAnchor = fund.anchor_amount || '{{AMOUNT}}';

        // 1. Investor Name Tab
        const nameTab = new ds.Text();
        if (fund.name_page && fund.name_x !== null && fund.name_y !== null) {
          nameTab.pageNumber = fund.name_page.toString();
          // Offset text tab (default width ~120px, height ~20px)
          nameTab.xPosition = Math.max(0, fund.name_x - 60).toString();
          nameTab.yPosition = Math.max(0, fund.name_y - 10).toString();
        } else {
          nameTab.anchorString = nameAnchor;
          nameTab.anchorUnits = 'pixels';
          nameTab.anchorXOffset = '10';
          nameTab.anchorYOffset = '-4';
        }
        nameTab.value = documentName;
        nameTab.font = 'TimesNewRoman';
        nameTab.fontSize = 'Size11';
        nameTab.tabLabel = 'Dynamic Investor Name';
        nameTab.locked = 'true';
        nameTab.documentId = '1';
        nameTab.recipientId = '1';
        textTabs.push(nameTab);

        // 2. Investment Amount Tab
        const amountTab = new ds.Text();
        if (fund.amount_page && fund.amount_x !== null && fund.amount_y !== null) {
          amountTab.pageNumber = fund.amount_page.toString();
          // Offset text tab (default width ~100px, height ~20px)
          amountTab.xPosition = Math.max(0, fund.amount_x - 50).toString();
          amountTab.yPosition = Math.max(0, fund.amount_y - 10).toString();
        } else {
          amountTab.anchorString = amountAnchor;
          amountTab.anchorUnits = 'pixels';
          amountTab.anchorXOffset = '10';
          amountTab.anchorYOffset = '-4';
        }
        amountTab.value = `$${investmentAmount.toLocaleString('en-US')}`;
        amountTab.font = 'TimesNewRoman';
        amountTab.fontSize = 'Size11';
        amountTab.tabLabel = 'Dynamic Investment Amount';
        amountTab.locked = 'true';
        amountTab.documentId = '1';
        amountTab.recipientId = '1';
        textTabs.push(amountTab);

        // 3. Date Signed Tab
        const dateTab = new ds.Text();
        if (fund.date_page && fund.date_x !== null && fund.date_y !== null) {
          dateTab.pageNumber = fund.date_page.toString();
          // Offset text tab (default width ~100px, height ~20px)
          dateTab.xPosition = Math.max(0, fund.date_x - 50).toString();
          dateTab.yPosition = Math.max(0, fund.date_y - 10).toString();
        } else {
          dateTab.anchorString = dateAnchor;
          dateTab.anchorUnits = 'pixels';
          dateTab.anchorXOffset = '10';
          dateTab.anchorYOffset = '-4';
        }
        dateTab.value = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
        dateTab.font = 'TimesNewRoman';
        dateTab.fontSize = 'Size11';
        dateTab.tabLabel = 'Dynamic Date';
        dateTab.locked = 'true';
        dateTab.documentId = '1';
        dateTab.recipientId = '1';
        textTabs.push(dateTab);

        // 4. Signature Tab
        const signatureTab = new ds.SignHere();
        if (fund.signature_page && fund.signature_x !== null && fund.signature_y !== null) {
          signatureTab.pageNumber = fund.signature_page.toString();
          // Offset signature tab (default width ~80px, height ~30px)
          signatureTab.xPosition = Math.max(0, fund.signature_x - 40).toString();
          signatureTab.yPosition = Math.max(0, fund.signature_y - 15).toString();
        } else {
          signatureTab.anchorString = signatureAnchor;
          signatureTab.anchorUnits = 'pixels';
          signatureTab.anchorXOffset = '10';
          signatureTab.anchorYOffset = '10';
        }
        signatureTab.documentId = '1';
        signatureTab.recipientId = '1';
        signHereTabs.push(signatureTab);
      }

      tabs.signHereTabs = signHereTabs;
      tabs.textTabs = textTabs;
    } else {
      // --- Original BWell Fallback Anchors ---
      
      // 1. OA First Page Name
      const startNameTab = new ds.Text();
      startNameTab.anchorString = '(the "Investor Member"';
      startNameTab.anchorUnits = 'pixels';
      
      // Dynamically center the name on the blank underline
      const textWidth = (documentName || '').length * 6.5;
      const calculatedOffset = Math.round(-200 + Math.max(0, (200 - textWidth) / 2));
      startNameTab.anchorXOffset = calculatedOffset.toString();
      
      startNameTab.anchorYOffset = '-8'; // Moved up a bit
      startNameTab.value = documentName;
      startNameTab.font = 'TimesNewRoman';
      startNameTab.fontSize = 'Size11';
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
      saAmount.font = 'TimesNewRoman';
      saAmount.fontSize = 'Size11';
      saAmount.tabLabel = 'Investment Amount';
      saAmount.locked = 'true';
      saAmount.documentId = '2';
      saAmount.recipientId = '1';

      const saName = new ds.Text();
      saName.anchorString = 'INVESTOR:';
      saName.anchorUnits = 'pixels';
      saName.anchorXOffset = '50';
      saName.anchorYOffset = '88'; // 3 lines down
      saName.value = documentName;
      saName.font = 'TimesNewRoman';
      saName.fontSize = 'Size11';
      saName.tabLabel = 'SA Investor Name';
      saName.locked = 'true';
      saName.documentId = '2';
      saName.recipientId = '1';

      const saDate = new ds.Text();
      saDate.anchorString = 'INVESTOR:';
      saDate.anchorUnits = 'pixels';
      saDate.anchorXOffset = '50';
      saDate.anchorYOffset = '122'; // 4 lines down
      saDate.value = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
      saDate.font = 'TimesNewRoman';
      saDate.fontSize = 'Size11';
      saDate.tabLabel = 'SA Date';
      saDate.locked = 'true';
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

      const oaDate = new ds.Text();
      oaDate.anchorString = 'INVESTOR MEMBER:';
      oaDate.anchorUnits = 'pixels';
      oaDate.anchorXOffset = '50';
      oaDate.anchorYOffset = '65'; // 2 lines down
      oaDate.value = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
      oaDate.font = 'TimesNewRoman';
      oaDate.fontSize = 'Size11';
      oaDate.tabLabel = 'OA Date';
      oaDate.locked = 'true';
      oaDate.anchorMatchWholeWord = 'true';
      oaDate.documentId = '1';
      oaDate.recipientId = '1';

      const oaName = new ds.Text();
      oaName.anchorString = 'INVESTOR MEMBER:';
      oaName.anchorUnits = 'pixels';
      oaName.anchorXOffset = '50';
      oaName.anchorYOffset = '105'; // 3 lines down
      oaName.value = documentName;
      oaName.font = 'TimesNewRoman';
      oaName.fontSize = 'Size11';
      oaName.tabLabel = 'OA Investor Name';
      oaName.locked = 'true';
      oaName.documentId = '1';
      oaName.recipientId = '1';

      tabs.signHereTabs = [saSignature, oaSignature];
      tabs.dateSignedTabs = [saDate, oaDate];
      tabs.textTabs = [startNameTab, saAmount, saName, oaName];
    }

    const signer = new ds.Signer();
    signer.email = signerEmail;
    signer.name = signatureName; // Use signatureName
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
      viewRequest.userName = signatureName; // Use signatureName
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
