import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../../config/database';
import { EmailService } from '../email/email.service';
import { DocusignService } from '../docusign/docusign.service';
const cloudinary = require('../../config/cloudinary.config').cloudinary;

@Injectable()
export class DocumentSignaturesService {
  private readonly logger = new Logger(DocumentSignaturesService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly docusignService: DocusignService,
  ) {}

  async createCampaign(name: string, file: Express.Multer.File, placements: any, investorIds: string[]) {
    try {
      // 1. Upload file to Cloudinary
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'raw',
        folder: 'document_signatures',
        format: 'pdf',
      });
      const documentPath = uploadResult.secure_url;

      // 2. Create campaign record
      const campaignRes = await db.query(
        'INSERT INTO document_signature_campaigns (name, original_document_path, placements) VALUES ($1, $2, $3) RETURNING id',
        [name, documentPath, JSON.stringify(placements)]
      );
      const campaignId = campaignRes.rows[0].id;

      // 2. Fetch all selected investors
      if (!Array.isArray(investorIds) || investorIds.length === 0) {
        throw new HttpException('No investors selected', HttpStatus.BAD_REQUEST);
      }
      if (typeof investorIds[0] === 'object') {
        throw new HttpException('Frontend is sending objects instead of strings for investorIds. Please fix frontend.', HttpStatus.BAD_REQUEST);
      }

      const placeholders = investorIds.map((_, i) => `$${i + 1}`).join(',');
      const usersRes = await db.query(`SELECT id, email, full_name FROM investors WHERE id IN (${placeholders})`, investorIds);
      const investors = usersRes.rows;

      // 3. For each investor, send email and add to recipients
      for (const investor of investors) {
        const signerName = (investor.full_name || 'Investor').trim() || 'Investor';

        // Send email
        let actualInvestorId = investor.id;
        if (typeof actualInvestorId === 'object') {
          actualInvestorId = (actualInvestorId as any).id || actualInvestorId;
        }
        
        // Add recipient as pending
        await db.query(
          'INSERT INTO document_signature_recipients (campaign_id, investor_id, status) VALUES ($1, $2, $3)',
          [campaignId, actualInvestorId, 'PENDING']
        );

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const signLink = `${backendUrl}/api/document-signatures/${campaignId}/sign-url/${actualInvestorId}`;

        await this.emailService.sendCampaignSignatureEmail(investor.email, signerName, name, signLink);
      }

      return { success: true, campaignId };
    } catch (error: any) {
      this.logger.error('Failed to create document signature campaign', error);
      throw new HttpException(error.message || 'Failed to create campaign', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCampaigns() {
    try {
      const res = await db.query(`
        SELECT c.*, 
          COALESCE(
            json_agg(
              json_build_object(
                'id', r.id,
                'investor_id', r.investor_id,
                'status', r.status,
                'signed_at', r.signed_at,
                'signed_document_path', r.signed_document_path,
                'investor_name', u.full_name,
                'investor_email', u.email
              )
            ) FILTER (WHERE r.id IS NOT NULL), '[]'
          ) as recipients
        FROM document_signature_campaigns c
        LEFT JOIN document_signature_recipients r ON c.id = r.campaign_id
        LEFT JOIN investors u ON r.investor_id = u.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      return res.rows;
    } catch (error) {
      this.logger.error('Failed to fetch campaigns', error);
      throw new HttpException('Failed to fetch campaigns', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSigningUrl(campaignId: string, investorId: string) {
    // Generate DocuSign envelope for this user and return URL
    // Since DocuSign envelope generation requires a return URL that triggers immediately,
    // this endpoint is called by the frontend iframe page to get the URL dynamically.
    try {
      const campaignRes = await db.query('SELECT * FROM document_signature_campaigns WHERE id = $1', [campaignId]);
      if (!campaignRes.rows.length) throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
      const campaign = campaignRes.rows[0];

      const userRes = await db.query('SELECT * FROM investors WHERE id = $1', [investorId]);
      if (!userRes.rows.length) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      const user = userRes.rows[0];

      const signerName = (user.full_name || 'Investor').trim() || 'Investor';

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const returnUrl = `${backendUrl}/api/document-signatures/${campaignId}/complete/${investorId}`;

      // This requires a custom generic envelope method in DocusignService, which we will add.
      const docusignAuth = await this.docusignService.getAccessTokenJWT();
      
      const result = await (this.docusignService as any).createEnvelopeForCampaign(
        docusignAuth.accessToken,
        docusignAuth.accountId,
        user.email,
        signerName,
        campaign.name,
        campaign.original_document_path,
        campaign.placements,
        returnUrl
      );

      // Save envelope ID
      await db.query(
        'UPDATE document_signature_recipients SET envelope_id = $1 WHERE campaign_id = $2 AND investor_id = $3',
        [result.envelopeId, campaignId, investorId]
      );

      return { signingUrl: result.signingUrl };
    } catch (error) {
      this.logger.error('Failed to generate signing URL', error);
      throw new HttpException('Failed to generate signing URL', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async completeSignature(campaignId: string, investorId: string) {
    // 1. Get recipient to find envelope_id
    try {
      const recipientRes = await db.query(
        'SELECT * FROM document_signature_recipients WHERE campaign_id = $1 AND investor_id = $2',
        [campaignId, investorId]
      );
      if (!recipientRes.rows.length) {
        throw new HttpException('Recipient not found', HttpStatus.NOT_FOUND);
      }
      
      const recipient = recipientRes.rows[0];
      let signedDocumentUrl = '';

      if (recipient.envelope_id) {
        // 2. Download signed document from DocuSign
        const auth = await this.docusignService.getAccessTokenJWT();
        let pdfData = await this.docusignService.getEnvelopeDocument(auth.accessToken, auth.accountId, recipient.envelope_id);
        
        let pdfBuffer: Buffer;
        if (typeof pdfData === 'string') {
          pdfBuffer = Buffer.from(pdfData, 'base64');
        } else if (Buffer.isBuffer(pdfData)) {
          pdfBuffer = pdfData;
        } else {
          pdfBuffer = Buffer.from(pdfData as any);
        }

        // 3. Upload to Cloudinary
        const dataURI = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          resource_type: 'raw',
          folder: 'document_signatures_completed',
          format: 'pdf',
        });
        signedDocumentUrl = uploadResult.secure_url;
      }

      // 4. Update status in DB
      await db.query(
        'UPDATE document_signature_recipients SET status = $1, signed_at = NOW(), signed_document_path = $2 WHERE campaign_id = $3 AND investor_id = $4',
        ['SIGNED', signedDocumentUrl, campaignId, investorId]
      );
      
      // 5. Save to Document Vault
      if (signedDocumentUrl) {
        const campaignRes = await db.query('SELECT name FROM document_signature_campaigns WHERE id = $1', [campaignId]);
        const campaignName = campaignRes.rows[0]?.name || 'Document Signature';
        const fileName = `Signed_${campaignName.replace(/\s+/g, '_')}_${recipient.id.substring(0, 8)}.pdf`;
        
        await db.query(
          `INSERT INTO investor_documents (investor_id, file_name, file_url, document_type, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            investorId,
            fileName,
            signedDocumentUrl,
            'Signature Document',
            `Signed document from campaign: ${campaignName}`
          ]
        );
      }
      
      return { success: true };
    } catch (error: any) {
      this.logger.error('Failed to complete signature', error);
      throw new HttpException(error.message || 'Failed to complete signature', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
