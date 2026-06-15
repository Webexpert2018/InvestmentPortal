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
    investorName: string,
    fundName: string,
    investmentAmount: number,
    returnUrl: string,
    fundId?: string,
    userId?: string,
    investorAccountId?: string
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

    // Check if OA is already signed for this account
    let oaSigned = false;
    if (userId && fundId) {
      try {
        if (investorAccountId && investorAccountId !== 'personal') {
          const checkRes = await db.query(
            `SELECT id FROM investments 
             WHERE user_id = $1 AND fund_id = $2 AND account_id = $3 AND document_signed = true LIMIT 1`,
            [userId, fundId, investorAccountId]
          );
          oaSigned = checkRes.rows.length > 0;
        } else {
          const checkRes = await db.query(
            `SELECT id FROM investments 
             WHERE user_id = $1 AND fund_id = $2 AND account_id IS NULL AND document_signed = true LIMIT 1`,
            [userId, fundId]
          );
          oaSigned = checkRes.rows.length > 0;
        }
        this.logger.log(`OA signing status check for user ${userId}, fund ${fundId}, account ${investorAccountId || 'personal'}: ${oaSigned ? 'ALREADY SIGNED' : 'NOT SIGNED'}`);
      } catch (dbErr) {
        this.logger.error('Failed to check if OA has been signed', dbErr);
      }
    }

    // Parse names for IRA/Entity accounts
    let documentName = investorName;
    let signatureName = signerName;

    // Clean up signatureName if it contains IRA/Account suffixes
    signatureName = signerName.replace(/\s+(Defined Benefit Plan|DB Plan|Traditional IRA|Traditional|Roth IRA|Roth SEP|SEP IRA|Roth|SEP|IRA|401k|Account)$/i, '').trim();

    // Use any to avoid lint errors with mismatching @types/docusign-esign
    const ds = docusign as any;
    const envelopesApi = new ds.EnvelopesApi(this.dsApiClient);

    const safeFundName = fundName.replace(/[^a-z0-9]/gi, '-');
    let docPaths = [];
    let defaultDocPaths = [];
    let isCustomDoc = false;

    // Determine custom document paths from database
    const hasCustomOA = !!(fund && fund.oa_doc_path);
    const hasCustomSA = !!(fund && fund.subscription_doc_path);

    if (hasCustomOA || hasCustomSA) {
      isCustomDoc = true;
      let docId = 1;
      if (!oaSigned && hasCustomOA) {
        docPaths.push({ name: 'Operating Agreement', filename: fund.oa_doc_path, id: String(docId++) });
      }
      if (hasCustomSA) {
        docPaths.push({ name: 'Subscription Agreement', filename: fund.subscription_doc_path, id: String(docId++) });
      } else {
        // Fallback custom SA
        docPaths.push({ name: 'Subscription Agreement', filename: `SA-${safeFundName}.pdf`, id: String(docId++) });
        defaultDocPaths.push({ name: 'Subscription Agreement', filename: 'SA-BWell-Fund.pdf', id: String(docId - 1) });
      }
    } else {
      let docId = 1;
      if (!oaSigned) {
        docPaths.push({ name: 'Operating Agreement', filename: `OA-${safeFundName}.pdf`, id: String(docId++) });
        defaultDocPaths.push({ name: 'Operating Agreement', filename: 'OA-BWell-Fund.pdf', id: String(docId - 1) });
      }
      docPaths.push({ name: 'Subscription Agreement', filename: `SA-${safeFundName}.pdf`, id: String(docId++) });
      defaultDocPaths.push({ name: 'Subscription Agreement', filename: 'SA-BWell-Fund.pdf', id: String(docId - 1) });
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
          const matchedDefault = defaultDocPaths.find(d => d.name === docInfo.name);
          if (!isCustomDoc && matchedDefault) {
            pathsToTry.push(
              path.resolve(process.cwd(), 'public/subscription-documents', matchedDefault.filename),
              path.resolve(__dirname, '..', '..', '..', 'public/subscription-documents', matchedDefault.filename)
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
    const oaDocId = '1';
    const saDocId = oaSigned ? '1' : '2';

    if (isCustomDoc && fund) {
      const signHereTabs: any[] = [];
      const textTabs: any[] = [];

      // A. Operating Agreement (OA) placements
      if (!oaSigned) {
        if (fund.oa_placements && Array.isArray(fund.oa_placements) && fund.oa_placements.length > 0) {
          this.logger.log(`Mapping ${fund.oa_placements.length} custom OA placements.`);
          fund.oa_placements.forEach((placement: any, idx: number) => {
            const pageStr = placement.page.toString();
            const width = 612;
            const height = 792;

            if (placement.type === 'signature') {
              const sig = new ds.SignHere();
              sig.pageNumber = pageStr;
              const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 40);
              const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 15);
              sig.xPosition = adjustedX.toString();
              sig.yPosition = adjustedY.toString();
              sig.documentId = oaDocId;
              sig.recipientId = '1';
              sig.tabLabel = `OASignature_${idx + 1}`;
              signHereTabs.push(sig);
            } else if (placement.type === 'name') {
              const nameTab = new ds.Text();
              nameTab.pageNumber = pageStr;
              const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 60);
              const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
              nameTab.xPosition = adjustedX.toString();
              nameTab.yPosition = adjustedY.toString();
              nameTab.value = documentName;
              nameTab.font = 'TimesNewRoman';
              nameTab.fontSize = 'Size11';
              nameTab.tabLabel = `OAName_${idx + 1}`;
              nameTab.locked = 'true';
              nameTab.documentId = oaDocId;
              nameTab.recipientId = '1';
              textTabs.push(nameTab);
            } else if (placement.type === 'date') {
              const dateTab = new ds.Text();
              dateTab.pageNumber = pageStr;
              const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 50);
              const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
              dateTab.xPosition = adjustedX.toString();
              dateTab.yPosition = adjustedY.toString();
              dateTab.value = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
              dateTab.font = 'TimesNewRoman';
              dateTab.fontSize = 'Size11';
              dateTab.tabLabel = `OADateSigned_${idx + 1}`;
              dateTab.locked = 'true';
              dateTab.documentId = oaDocId;
              dateTab.recipientId = '1';
              textTabs.push(dateTab);
            } else if (placement.type === 'amount') {
              const amountTab = new ds.Text();
              amountTab.pageNumber = pageStr;
              const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 50);
              const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
              amountTab.xPosition = adjustedX.toString();
              amountTab.yPosition = adjustedY.toString();
              amountTab.value = `$${investmentAmount.toLocaleString('en-US')}`;
              amountTab.font = 'TimesNewRoman';
              amountTab.fontSize = 'Size11';
              amountTab.tabLabel = `OAInvestmentAmount_${idx + 1}`;
              amountTab.locked = 'true';
              amountTab.documentId = oaDocId;
              amountTab.recipientId = '1';
              textTabs.push(amountTab);
            }
          });
        } else {
          // Fallback BWell anchors for Operating Agreement
          const oaSignature = new ds.SignHere();
          oaSignature.anchorString = 'INVESTOR MEMBER:';
          oaSignature.anchorUnits = 'pixels';
          oaSignature.anchorXOffset = '100';
          oaSignature.anchorYOffset = '25';
          oaSignature.anchorMatchWholeWord = 'true';
          oaSignature.documentId = oaDocId;
          oaSignature.recipientId = '1';
          signHereTabs.push(oaSignature);

          const oaDate = new ds.Text();
          oaDate.anchorString = 'INVESTOR MEMBER:';
          oaDate.anchorUnits = 'pixels';
          oaDate.anchorXOffset = '50';
          oaDate.anchorYOffset = '65';
          oaDate.value = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
          oaDate.font = 'TimesNewRoman';
          oaDate.fontSize = 'Size11';
          oaDate.tabLabel = 'OA Date';
          oaDate.locked = 'true';
          oaDate.anchorMatchWholeWord = 'true';
          oaDate.documentId = oaDocId;
          oaDate.recipientId = '1';
          textTabs.push(oaDate);

          const oaName = new ds.Text();
          oaName.anchorString = 'INVESTOR MEMBER:';
          oaName.anchorUnits = 'pixels';
          oaName.anchorXOffset = '50';
          oaName.anchorYOffset = '105';
          oaName.value = documentName;
          oaName.font = 'TimesNewRoman';
          oaName.fontSize = 'Size11';
          oaName.tabLabel = 'OA Investor Name';
          oaName.locked = 'true';
          oaName.documentId = oaDocId;
          oaName.recipientId = '1';
          textTabs.push(oaName);
        }
      }

      // B. Subscription Agreement (SA) placements
      if (fund.placements && Array.isArray(fund.placements) && fund.placements.length > 0) {
        this.logger.log(`Mapping ${fund.placements.length} custom SA placements.`);
        fund.placements.forEach((placement: any, idx: number) => {
          const pageStr = placement.page.toString();
          const width = 612;
          const height = 792;

          if (placement.type === 'signature') {
            const sig = new ds.SignHere();
            sig.pageNumber = pageStr;
            const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 40);
            const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 15);
            sig.xPosition = adjustedX.toString();
            sig.yPosition = adjustedY.toString();
            sig.documentId = saDocId;
            sig.recipientId = '1';
            sig.tabLabel = `Signature_${idx + 1}`;
            signHereTabs.push(sig);
          } else if (placement.type === 'name') {
            const nameTab = new ds.Text();
            nameTab.pageNumber = pageStr;
            const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 60);
            const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
            nameTab.xPosition = adjustedX.toString();
            nameTab.yPosition = adjustedY.toString();
            nameTab.value = documentName;
            nameTab.font = 'TimesNewRoman';
            nameTab.fontSize = 'Size11';
            nameTab.tabLabel = `InvestorName_${idx + 1}`;
            nameTab.locked = 'true';
            nameTab.documentId = saDocId;
            nameTab.recipientId = '1';
            textTabs.push(nameTab);
          } else if (placement.type === 'amount') {
            const amountTab = new ds.Text();
            amountTab.pageNumber = pageStr;
            const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 50);
            const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
            amountTab.xPosition = adjustedX.toString();
            amountTab.yPosition = adjustedY.toString();
            amountTab.value = `$${investmentAmount.toLocaleString('en-US')}`;
            amountTab.font = 'TimesNewRoman';
            amountTab.fontSize = 'Size11';
            amountTab.tabLabel = `InvestmentAmount_${idx + 1}`;
            amountTab.locked = 'true';
            amountTab.documentId = saDocId;
            amountTab.recipientId = '1';
            textTabs.push(amountTab);
          } else if (placement.type === 'date') {
            const dateTab = new ds.Text();
            dateTab.pageNumber = pageStr;
            const adjustedX = Math.max(0, Math.round((placement.xPercent / 100) * width) - 50);
            const adjustedY = Math.max(0, Math.round((placement.yPercent / 100) * height) - 10);
            dateTab.xPosition = adjustedX.toString();
            dateTab.yPosition = adjustedY.toString();
            dateTab.value = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
            dateTab.font = 'TimesNewRoman';
            dateTab.fontSize = 'Size11';
            dateTab.tabLabel = `DateSigned_${idx + 1}`;
            dateTab.locked = 'true';
            dateTab.documentId = saDocId;
            dateTab.recipientId = '1';
            textTabs.push(dateTab);
          }
        });
      } else {
        // Fallback configurator or absolute coordinates for SA
        const nameAnchor = fund.anchor_name || '{{NAME}}';
        const dateAnchor = fund.anchor_date || '{{DATE}}';
        const signatureAnchor = fund.anchor_signature || '{{SIGNATURE}}';
        const amountAnchor = fund.anchor_amount || '{{AMOUNT}}';

        // 1. Investor Name Tab
        const nameTab = new ds.Text();
        if (fund.name_page && fund.name_x !== null && fund.name_y !== null) {
          nameTab.pageNumber = fund.name_page.toString();
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
        nameTab.documentId = saDocId;
        nameTab.recipientId = '1';
        textTabs.push(nameTab);

        // 2. Investment Amount Tab
        const amountTab = new ds.Text();
        if (fund.amount_page && fund.amount_x !== null && fund.amount_y !== null) {
          amountTab.pageNumber = fund.amount_page.toString();
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
        amountTab.documentId = saDocId;
        amountTab.recipientId = '1';
        textTabs.push(amountTab);

        // 3. Date Signed Tab
        const dateTab = new ds.Text();
        if (fund.date_page && fund.date_x !== null && fund.date_y !== null) {
          dateTab.pageNumber = fund.date_page.toString();
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
        dateTab.documentId = saDocId;
        dateTab.recipientId = '1';
        textTabs.push(dateTab);

        // 4. Signature Tab
        const signatureTab = new ds.SignHere();
        if (fund.signature_page && fund.signature_x !== null && fund.signature_y !== null) {
          signatureTab.pageNumber = fund.signature_page.toString();
          signatureTab.xPosition = Math.max(0, fund.signature_x - 40).toString();
          signatureTab.yPosition = Math.max(0, fund.signature_y - 15).toString();
        } else {
          signatureTab.anchorString = signatureAnchor;
          signatureTab.anchorUnits = 'pixels';
          signatureTab.anchorXOffset = '10';
          signatureTab.anchorYOffset = '10';
        }
        signatureTab.documentId = saDocId;
        signatureTab.recipientId = '1';
        signHereTabs.push(signatureTab);
      }

      tabs.signHereTabs = signHereTabs;
      tabs.textTabs = textTabs;
    } else {
      // --- Original BWell Fallback Anchors ---
      const signHereTabs: any[] = [];
      const textTabs: any[] = [];
      
      // SA always present on saDocId
      const saSignature = new ds.SignHere();
      saSignature.anchorString = 'INVESTOR:';
      saSignature.anchorUnits = 'pixels';
      saSignature.anchorXOffset = '100';
      saSignature.anchorYOffset = '55'; // 2 lines down
      saSignature.anchorMatchWholeWord = 'true';
      saSignature.documentId = saDocId;
      saSignature.recipientId = '1';
      signHereTabs.push(saSignature);

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
      saAmount.documentId = saDocId;
      saAmount.recipientId = '1';
      textTabs.push(saAmount);

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
      saName.documentId = saDocId;
      saName.recipientId = '1';
      textTabs.push(saName);

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
      saDate.documentId = saDocId;
      saDate.recipientId = '1';
      textTabs.push(saDate);

      // OA only present if oaSigned is false
      if (!oaSigned) {
        // OA Signature Block (Anchored to "INVESTOR MEMBER:")
        const oaSignature = new ds.SignHere();
        oaSignature.anchorString = 'INVESTOR MEMBER:';
        oaSignature.anchorUnits = 'pixels';
        oaSignature.anchorXOffset = '100';
        oaSignature.anchorYOffset = '25'; // 1 line down
        oaSignature.anchorMatchWholeWord = 'true';
        oaSignature.documentId = oaDocId;
        oaSignature.recipientId = '1';
        signHereTabs.push(oaSignature);

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
        oaDate.documentId = oaDocId;
        oaDate.recipientId = '1';
        textTabs.push(oaDate);

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
        oaName.documentId = oaDocId;
        oaName.recipientId = '1';
        textTabs.push(oaName);

        // OA First Page Name
        const startNameTab = new ds.Text();
        startNameTab.anchorString = '(the "Investor Member"';
        startNameTab.anchorUnits = 'pixels';
        const textWidth = (documentName || '').length * 6.5;
        const calculatedOffset = Math.round(-200 + Math.max(0, (200 - textWidth) / 2));
        startNameTab.anchorXOffset = calculatedOffset.toString();
        startNameTab.anchorYOffset = '-8'; // Moved up a bit
        startNameTab.value = documentName;
        startNameTab.font = 'TimesNewRoman';
        startNameTab.fontSize = 'Size11';
        startNameTab.tabLabel = 'Initial Investor Name';
        startNameTab.locked = 'true';
        startNameTab.documentId = oaDocId;
        startNameTab.recipientId = '1';
        textTabs.push(startNameTab);
      }

      tabs.signHereTabs = signHereTabs;
      tabs.textTabs = textTabs;
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
   * Fetches the list of documents inside an envelope.
   */
  async getEnvelopeDocumentsList(accessToken: string, accountId: string, envelopeId: string) {
    this.dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    const ds = docusign as any;
    const envelopesApi = new ds.EnvelopesApi(this.dsApiClient);

    try {
      const results = await envelopesApi.listDocuments(accountId, envelopeId);
      return results.envelopeDocuments || [];
    } catch (error: any) {
      this.logger.error('Error fetching DocuSign documents list:', error.response?.body || error.message);
      throw error;
    }
  }

  /**
   * Fetches a specific PDF for a given envelope and document ID.
   */
  async getEnvelopeDocument(accessToken: string, accountId: string, envelopeId: string, documentId: string = 'combined') {
    this.dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    const ds = docusign as any;
    const envelopesApi = new ds.EnvelopesApi(this.dsApiClient);

    try {
      const results = await envelopesApi.getDocument(accountId, envelopeId, documentId);
      // The SDK returns the document content as a string/buffer
      return results;
    } catch (error: any) {
      this.logger.error(`Error fetching DocuSign document ${documentId}:`, error.response?.body || error.message);
      throw error;
    }
  }
}
