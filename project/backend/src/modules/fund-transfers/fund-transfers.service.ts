import { Injectable, BadRequestException } from '@nestjs/common';
import { db } from '../../config/database';
import { cloudinary } from '../../config/cloudinary.config';
import { DocusignService } from '../docusign/docusign.service';
import { EmailService } from '../email/email.service';
import * as fs from 'fs';

@Injectable()
export class FundTransfersService {
  constructor(
    private readonly docusignService: DocusignService,
    private readonly emailService: EmailService
  ) {}

  async findAll() {
    const res = await db.query(`
      SELECT ft.*, 
             fi.full_name as from_investor_name,
             ti.full_name as to_investor_name,
             COALESCE(ff.name, off.project_name) as from_fund_name,
             COALESCE(tf.name, tf_off.project_name) as to_fund_name
      FROM fund_transfers ft
      LEFT JOIN investors fi ON ft.from_investor_id = fi.id
      LEFT JOIN investors ti ON ft.to_investor_id = ti.id
      LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
      LEFT JOIN old_funds off ON ft.from_fund_id = off.project_id::text
      LEFT JOIN funds tf ON ft.to_fund_id = tf.id::text
      LEFT JOIN old_funds tf_off ON ft.to_fund_id = tf_off.project_id::text
      ORDER BY ft.created_at DESC
    `);
    return res.rows;
  }

  async findByInvestor(investorId: string) {
    const res = await db.query(`
      SELECT ft.*, 
             fi.full_name as from_investor_name,
             ti.full_name as to_investor_name,
             COALESCE(ff.name, off.project_name) as from_fund_name,
             COALESCE(tf.name, tf_off.project_name) as to_fund_name
      FROM fund_transfers ft
      LEFT JOIN investors fi ON ft.from_investor_id = fi.id
      LEFT JOIN investors ti ON ft.to_investor_id = ti.id
      LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
      LEFT JOIN old_funds off ON ft.from_fund_id = off.project_id::text
      LEFT JOIN funds tf ON ft.to_fund_id = tf.id::text
      LEFT JOIN old_funds tf_off ON ft.to_fund_id = tf_off.project_id::text
      WHERE ft.from_investor_id = $1 OR ft.to_investor_id = $1
      ORDER BY ft.created_at DESC
    `, [investorId]);
    return res.rows;
  }

  async findOne(id: string) {
    const res = await db.query(`
      SELECT ft.*, 
             fi.full_name as from_investor_name,
             ti.full_name as to_investor_name,
             COALESCE(ff.name, off.project_name) as from_fund_name,
             COALESCE(tf.name, tf_off.project_name) as to_fund_name
      FROM fund_transfers ft
      LEFT JOIN investors fi ON ft.from_investor_id = fi.id
      LEFT JOIN investors ti ON ft.to_investor_id = ti.id
      LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
      LEFT JOIN old_funds off ON ft.from_fund_id = off.project_id::text
      LEFT JOIN funds tf ON ft.to_fund_id = tf.id::text
      LEFT JOIN old_funds tf_off ON ft.to_fund_id = tf_off.project_id::text
      WHERE ft.id = $1
    `, [id]);
    return res.rows[0];
  }

  async delete(id: string) {
    const transfer = await this.findOne(id);
    if (!transfer) {
      throw new BadRequestException('Transfer not found');
    }
    if (transfer.status === 'COMPLETED') {
      throw new BadRequestException('Cannot delete a completed transfer');
    }
    const res = await db.query(`DELETE FROM fund_transfers WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  }

  async getOldInvestorAccounts(investorId: string) {
    const investorRes = await db.query(`SELECT email FROM investors WHERE id = $1`, [investorId]);
    if (investorRes.rows.length === 0) return [];
    const email = investorRes.rows[0].email;

    const res = await db.query(`SELECT ims_profile_id, legal_name, primary_email, profile_type FROM old_investors WHERE primary_email = $1`, [email]);
    return res.rows;
  }

  async getSenderFunds(investorId: string, accountId?: string, accountType?: string) {
    const investorRes = await db.query(`SELECT email FROM investors WHERE id = $1`, [investorId]);
    if (investorRes.rows.length === 0) return [];
    const email = investorRes.rows[0].email;
    
    let accountFilter = '';
    const params: any[] = [investorId, email];
    if (accountType === 'old_investor') {
      accountFilter = `AND account_type ILIKE 'ims-%'`;
    } else if (accountType === 'personal') {
      accountFilter = `AND (account_type ILIKE 'personal' OR account_type IS NULL)`;
    } else if (accountType === 'ira') {
      accountFilter = `AND account_type ILIKE '%ira%' AND account_type NOT ILIKE 'ims-%'`;
    }

    const res = await db.query(`
      WITH combined_investments AS (
        SELECT 
          f.id::text as fund_id,
          f.name as fund_name,
          f.unit_price as current_nav,
          i.estimated_units as units,
          COALESCE(i.account_type, 'personal') as account_type
        FROM investments i
        JOIN funds f ON i.fund_id = f.id
        WHERE i.user_id = $1 AND i.is_reconciled = true

        UNION ALL

        SELECT 
          COALESCE(f.id::text, oi.project_id::text) as fund_id,
          oi.project_name as fund_name,
          COALESCE(
            f.unit_price,
            (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1),
            1
          ) as current_nav,
          (CAST(NULLIF(regexp_replace(oi.investment_amount::text, '[^0-9.]', '', 'g'), '') AS numeric) / 
           NULLIF(COALESCE(
             f.unit_price,
             (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1),
             1
           ), 0)) as units,
          'ims-' || COALESCE(o_inv.profile_type, 'Individual') || ' account' as account_type
        FROM old_investments oi
        LEFT JOIN old_investors o_inv ON oi.investor_profile_id = o_inv.ims_profile_id
        LEFT JOIN funds f ON oi.project_name = f.name
        WHERE o_inv.primary_email = $2

        UNION ALL

        SELECT 
          f.id::text as fund_id,
          f.name as fund_name,
          f.unit_price as current_nav,
          (-1 * r.units) as units,
          COALESCE(i.account_type, 'personal') as account_type
        FROM redemptions r
        JOIN investments i ON r.investment_id = i.id
        JOIN funds f ON i.fund_id = f.id
        WHERE r.investor_id = $1 AND r.status = 'Processed'

        UNION ALL

        SELECT 
          ft.from_fund_id as fund_id,
          COALESCE(ff.name, off.project_name) as fund_name,
          COALESCE(
            ff.unit_price,
            (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1),
            1
          ) as current_nav,
          CASE
            WHEN ft.from_account_type ILIKE 'ims-%' THEN 
              (-1 * ft.investment_amount) / NULLIF(COALESCE(ff.unit_price, (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), 1), 0)
            ELSE 
              (-1 * ft.units)
          END as units,
          ft.from_account_type as account_type
        FROM fund_transfers ft
        LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
        LEFT JOIN old_funds off ON ft.from_fund_id = off.project_id::text
        WHERE ft.from_investor_id = $1 AND ft.status = 'COMPLETED'

        UNION ALL

        SELECT 
          COALESCE(ft.to_fund_id, ft.from_fund_id) as fund_id,
          COALESCE(tf.name, tf_off.project_name, ff.name, off.project_name) as fund_name,
          COALESCE(
            tf.unit_price,
            ff.unit_price,
            (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1),
            1
          ) as current_nav,
          CASE
            WHEN COALESCE(ft.to_account_type, ft.from_account_type) ILIKE 'ims-%' THEN 
              ft.investment_amount / NULLIF(COALESCE(tf.unit_price, ff.unit_price, (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), 1), 0)
            ELSE 
              ft.units
          END as units,
          COALESCE(ft.to_account_type, ft.from_account_type) as account_type
        FROM fund_transfers ft
        LEFT JOIN funds tf ON ft.to_fund_id = tf.id::text
        LEFT JOIN old_funds tf_off ON ft.to_fund_id = tf_off.project_id::text
        LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
        LEFT JOIN old_funds off ON ft.from_fund_id = off.project_id::text
        WHERE (ft.to_investor_id = $1 OR (ft.to_investor_id IS NULL AND ft.from_investor_id = $1)) AND ft.status = 'COMPLETED'
      )
      SELECT 
        fund_id,
        fund_name,
        current_nav,
        SUM(units) as total_units,
        ROUND(SUM(units * COALESCE(current_nav, 1)), 2) as max_value
      FROM combined_investments
      WHERE units IS NOT NULL ${accountFilter}
      GROUP BY fund_id, fund_name, current_nav
      HAVING ROUND(SUM(units * COALESCE(current_nav, 1)), 2) > 0
      ORDER BY fund_name ASC
    `, params);
    
    return res.rows;
  }

  async getTemplate(transferType: string) {
    const res = await db.query(
      `SELECT * FROM fund_transfer_templates WHERE transfer_type = $1`,
      [transferType]
    );
    return res.rows[0] || null;
  }

  async upsertTemplate(transferType: string, file: any, placements: any[]) {
    let documentUrl = '';
    
    if (file) {
      try {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          resource_type: 'raw',
          folder: 'fund_transfers_templates',
          format: 'pdf',
        });
        documentUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading template document:', error);
        throw new BadRequestException('Failed to upload template document');
      }
    } else {
      throw new BadRequestException('File is required to upload a template');
    }

    const res = await db.query(
      `INSERT INTO fund_transfer_templates (transfer_type, document_url, placements)
       VALUES ($1, $2, $3)
       ON CONFLICT (transfer_type) 
       DO UPDATE SET document_url = EXCLUDED.document_url, placements = EXCLUDED.placements, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [transferType, documentUrl, JSON.stringify(placements)]
    );
    return res.rows[0];
  }

  async create(data: any, file: any) {
    let documentUrl = '';
    let documentBase64 = '';
    let documentName = 'Transfer_Agreement.pdf';

    // If file is provided, upload it and use it.
    if (file) {
      documentName = file.originalname;
      documentBase64 = file.buffer.toString('base64');
      try {
        const dataURI = `data:${file.mimetype};base64,${documentBase64}`;
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          resource_type: 'raw',
          folder: 'fund_transfers',
          format: 'pdf',
        });
        documentUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading transfer document:', error);
        throw new BadRequestException('Failed to upload transfer document');
      }
    } else {
      // If no file is provided, look up the template
      const template = await this.getTemplate(data.transferType);
      if (!template) {
        throw new BadRequestException('No document provided and no template found for this transfer type.');
      }
      documentUrl = template.document_url;
      
      // We must fetch the document bytes to pass to DocuSign
      try {
        const urlParts = documentUrl.split('/upload/');
        if (urlParts.length !== 2) throw new Error('Invalid document URL format.');
        let publicId = urlParts[1];
        if (publicId.match(/^v\d+\//)) {
          publicId = publicId.replace(/^v\d+\//, '');
        }

        const signedUrl = cloudinary.utils.private_download_url(publicId, '', {
          resource_type: 'raw',
          type: 'upload'
        });

        const fetchRes = await fetch(signedUrl);
        if (!fetchRes.ok) {
          throw new Error(`Failed to fetch document: ${fetchRes.statusText}`);
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        documentBase64 = Buffer.from(arrayBuffer).toString('base64');
      } catch (error) {
        console.error('Error fetching template document from URL:', error);
        throw new BadRequestException('Failed to fetch the saved template document.');
      }
    }

    if (data.fromAccountType === 'old_investor' && data.fromAccountId) {
      const pRes = await db.query(`SELECT profile_type FROM old_investors WHERE ims_profile_id = $1`, [data.fromAccountId]);
      if (pRes.rows.length > 0) {
        data.fromAccountType = `ims-${pRes.rows[0].profile_type} account`;
      }
    }
    if (data.toAccountType === 'old_investor' && data.toAccountId) {
      const pRes = await db.query(`SELECT profile_type FROM old_investors WHERE ims_profile_id = $1`, [data.toAccountId]);
      if (pRes.rows.length > 0) {
        data.toAccountType = `ims-${pRes.rows[0].profile_type} account`;
      }
    }

    if (data.fromAccountType === 'ira' && data.fromAccountId) {
      const iRes = await db.query(`SELECT account_type FROM ira_accounts WHERE id = $1`, [data.fromAccountId]);
      if (iRes.rows.length > 0 && iRes.rows[0].account_type) {
        data.fromAccountType = iRes.rows[0].account_type;
      }
    }
    if (data.toAccountType === 'ira' && data.toAccountId) {
      const iRes = await db.query(`SELECT account_type FROM ira_accounts WHERE id = $1`, [data.toAccountId]);
      if (iRes.rows.length > 0 && iRes.rows[0].account_type) {
        data.toAccountType = iRes.rows[0].account_type;
      }
    }

    // 2. Insert DB Record
    const res = await db.query(
      `INSERT INTO fund_transfers 
       (transfer_type, from_investor_id, to_investor_id, from_account_type, from_account_id, to_account_type, to_account_id, from_fund_id, to_fund_id, investment_amount, units, document_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING_SIGNATURE')
       RETURNING *`,
      [
        data.transferType,
        data.fromInvestorId,
        data.toInvestorId || null,
        data.fromAccountType || 'personal',
        data.fromAccountId || null,
        data.toAccountType || 'personal',
        data.toAccountId || null,
        data.fromFundId,
        data.toFundId || null,
        data.investmentAmount,
        data.units,
        documentUrl
      ]
    );

    const transfer = res.rows[0];

    // Fetch related entity names for document fields
    const fromInv = await db.query('SELECT full_name FROM investors WHERE id = $1', [data.fromInvestorId]);
    const toInv = data.toInvestorId ? await db.query('SELECT full_name FROM investors WHERE id = $1', [data.toInvestorId]) : null;
    const fromFund = await db.query('SELECT name FROM funds WHERE id::text = $1', [data.fromFundId]);
    const toFund = data.toFundId ? await db.query('SELECT name FROM funds WHERE id::text = $1', [data.toFundId]) : null;

    const fieldValues: any = {
      sender_name: fromInv.rows[0]?.full_name || '',
      receiver_name: toInv?.rows[0]?.full_name || '',
      investor_name: fromInv.rows[0]?.full_name || '', // Same as sender_name usually
      sender_fund: fromFund.rows[0]?.name || '',
      receiver_fund: toFund?.rows[0]?.name || '',
      amount: data.investmentAmount ? `$${Number(data.investmentAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '',
      date: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    };

    // 3. Create DocuSign Envelope
    if (data.bypassDocusign) {
      return transfer;
    }

    const { envelopeId, signingUrl } = await this.docusignService.createEnvelopeForTransfer(
      data.signerEmail,
      data.signerName,
      documentBase64,
      documentName,
      data.placements,
      fieldValues,
      transfer.id
    );

    // 4. Update Record with Envelope ID
    if (envelopeId) {
      await db.query(`UPDATE fund_transfers SET docusign_envelope_id = $1 WHERE id = $2`, [envelopeId, transfer.id]);
      transfer.docusign_envelope_id = envelopeId;
      
      // Send custom email via SMTP with a dynamic signing link
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const signLink = `${backendUrl}/api/fund-transfers/${transfer.id}/sign`;
      await this.emailService.sendFundTransferSignatureEmail(data.signerEmail, data.signerName, signLink);
    }

    return transfer;
  }

  async generateSignUrl(transferId: string): Promise<string> {
    const res = await db.query(
      `SELECT t.*, i.full_name as signer_name, i.email as signer_email
       FROM fund_transfers t
       JOIN investors i ON t.from_investor_id = i.id
       WHERE t.id = $1`,
      [transferId]
    );

    if (res.rows.length === 0) {
      throw new BadRequestException('Transfer not found');
    }

    const transfer = res.rows[0];
    if (!transfer.docusign_envelope_id) {
      throw new BadRequestException('Transfer document not sent for signature yet');
    }

    return this.docusignService.getTransferSigningUrl(
      transfer.docusign_envelope_id,
      transfer.signer_email,
      transfer.signer_name,
      transfer.id
    );
  }

  async completeTransfer(transferId: string): Promise<any> {
    const res = await db.query('SELECT * FROM fund_transfers WHERE id = $1', [transferId]);
    if (res.rows.length === 0) throw new BadRequestException('Transfer not found');
    
    const transfer = res.rows[0];
    if (transfer.status === 'SIGNED' || transfer.status === 'COMPLETED') return transfer;
    
    if (!transfer.docusign_envelope_id) {
      throw new BadRequestException('Transfer missing DocuSign envelope ID');
    }

    // 1. Download signed document from DocuSign
    const auth = await this.docusignService.getAccessTokenJWT();
    let pdfData = await this.docusignService.getEnvelopeDocument(auth.accessToken, auth.accountId, transfer.docusign_envelope_id);
    let pdfBuffer: Buffer;
    if (typeof pdfData === 'string') {
      pdfBuffer = Buffer.from(pdfData, 'base64');
    } else if (Buffer.isBuffer(pdfData)) {
      pdfBuffer = pdfData;
    } else {
      pdfBuffer = Buffer.from(pdfData as any);
    }

    // 2. Upload to Cloudinary
    let finalDocUrl = transfer.document_url;
    try {
      const dataURI = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'raw',
        folder: 'fund_transfers_completed',
        format: 'pdf',
      });
      finalDocUrl = uploadResult.secure_url;
    } catch (error) {
      console.error('Error uploading completed transfer document to Cloudinary:', error);
      // Fallback to existing document URL if upload fails, but continue to complete
    }

    // 3. Update status in DB
    const updateRes = await db.query(
      `UPDATE fund_transfers SET status = 'SIGNED', document_url = $1 WHERE id = $2 RETURNING *`,
      [finalDocUrl, transferId]
    );

    return updateRes.rows[0];
  }

  async updateInternalAmount(id: string, amount: number) {
    const res = await db.query(
      `UPDATE fund_transfers SET internal_amount = $1 WHERE id = $2 RETURNING *`,
      [amount, id]
    );
    if (res.rows.length === 0) throw new BadRequestException('Transfer not found');
    return res.rows[0];
  }

  async reconcile(id: string, status: boolean) {
    const res = await db.query(
      `UPDATE fund_transfers 
       SET is_reconciled = $1, 
           status = CASE WHEN $1 = true THEN 'COMPLETED' ELSE status END 
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (res.rows.length === 0) throw new BadRequestException('Transfer not found');
    return res.rows[0];
  }

  async getInvestorsByFund(fundId: string) {
    const res = await db.query(`
      WITH combined_investments AS (
        SELECT 
          i.user_id as id,
          COALESCE(i.account_type, 'personal') as account_type,
          i.estimated_units as units
        FROM investments i
        WHERE i.fund_id::text = $1 AND i.is_reconciled = true

        UNION ALL

        SELECT 
          u.id as id,
          'ims-' || COALESCE(o_inv.profile_type, 'Individual') || ' account' as account_type,
          (CAST(NULLIF(regexp_replace(oi.investment_amount::text, '[^0-9.]', '', 'g'), '') AS numeric) / 
           NULLIF(COALESCE(
             f.unit_price,
             (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1),
             1
           ), 0)) as units
        FROM old_investments oi
        LEFT JOIN old_investors o_inv ON oi.investor_profile_id = o_inv.ims_profile_id
        JOIN investors u ON LOWER(TRIM(u.email)) = LOWER(TRIM(COALESCE(o_inv.primary_email, oi.email_address)))
        LEFT JOIN funds f ON oi.project_name = f.name
        WHERE (f.id::text = $1 OR oi.project_id::text = $1)

        UNION ALL

        SELECT 
          r.investor_id as id,
          COALESCE(i.account_type, 'personal') as account_type,
          (-1 * r.units) as units
        FROM redemptions r
        JOIN investments i ON r.investment_id = i.id
        WHERE i.fund_id::text = $1 AND r.status = 'Processed'

        UNION ALL

        SELECT 
          ft.from_investor_id as id,
          ft.from_account_type as account_type,
          CASE
            WHEN ft.from_account_type ILIKE 'ims-%' THEN 
              (-1 * ft.investment_amount) / NULLIF(COALESCE(ff.unit_price, (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), 1), 0)
            ELSE 
              (-1 * ft.units)
          END as units
        FROM fund_transfers ft
        LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
        WHERE ft.from_fund_id = $1 AND ft.status = 'COMPLETED'

        UNION ALL

        SELECT 
          COALESCE(ft.to_investor_id, ft.from_investor_id) as id,
          COALESCE(ft.to_account_type, ft.from_account_type) as account_type,
          CASE
            WHEN COALESCE(ft.to_account_type, ft.from_account_type) ILIKE 'ims-%' THEN 
              ft.investment_amount / NULLIF(COALESCE(tf.unit_price, ff.unit_price, (SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1), 1), 0)
            ELSE 
              ft.units
          END as units
        FROM fund_transfers ft
        LEFT JOIN funds tf ON ft.to_fund_id = tf.id::text
        LEFT JOIN funds ff ON ft.from_fund_id = ff.id::text
        WHERE COALESCE(ft.to_fund_id, ft.from_fund_id) = $1 AND ft.status = 'COMPLETED'
      )
      SELECT 
        c.id,
        c.account_type,
        u.full_name,
        u.email,
        SUM(c.units) as total_units
      FROM combined_investments c
      JOIN investors u ON c.id = u.id
      WHERE c.units IS NOT NULL
      GROUP BY c.id, c.account_type, u.full_name, u.email
      HAVING SUM(c.units) > 0
    `, [fundId]);

    return res.rows;
  }
}
