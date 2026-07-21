import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

@Injectable()
export class DocumentsService {
  async getFundDocuments(fundId: string) {
    const result = await db.query(
      'SELECT * FROM fund_documents WHERE fund_id = $1 ORDER BY uploaded_at DESC',
      [fundId]
    );
    return result.rows;
  }

  async getAllDocuments(userId?: string, role?: string) {
    let query = `
      SELECT d.*, i.full_name as "investorName", i.profile_image_url as "investorAvatar"
      FROM investor_documents d
      JOIN investors i ON d.investor_id = i.id
    `;
    const params: any[] = [];

    if (role === 'accountant' && userId) {
      query += ` WHERE i.assigned_accountant_id = $1 `;
      params.push(userId);
    } else if (role === 'investor' && userId) {
      query += ` WHERE d.investor_id = $1 `;
      params.push(userId);
    }

    query += ` ORDER BY d.uploaded_at DESC`;

    const result = await db.query(query, params);

    let oldDocsQuery = `SELECT * FROM old_investor_documents ORDER BY created_at DESC`;
    let oldDocsParams: any[] = [];

    if (role === 'accountant' && userId) {
      oldDocsQuery = `
        SELECT d.*
        FROM old_investor_documents d
        WHERE EXISTS (
          SELECT 1 FROM investors i 
          WHERE i.assigned_accountant_id = $1 
            AND i.email IS NOT NULL 
            AND TRIM(i.email) != ''
            AND (
              (d.email_address IS NOT NULL AND LOWER(TRIM(i.email)) = LOWER(TRIM(d.email_address)))
              OR EXISTS (
                SELECT 1 FROM old_investments oi
                WHERE oi.investor_profile_id = d.investor_profile_id
                  AND oi.email_address IS NOT NULL
                  AND LOWER(TRIM(i.email)) = LOWER(TRIM(oi.email_address))
              )
            )
        )
        ORDER BY d.created_at DESC
      `;
      oldDocsParams = [userId];
    } else if (role === 'investor' && userId) {
      oldDocsQuery = `
        SELECT d.*
        FROM old_investor_documents d
        WHERE EXISTS (
          SELECT 1 FROM investors i 
          WHERE i.id = $1 
            AND i.email IS NOT NULL 
            AND TRIM(i.email) != ''
            AND (
              (d.email_address IS NOT NULL AND LOWER(TRIM(i.email)) = LOWER(TRIM(d.email_address)))
              OR EXISTS (
                SELECT 1 FROM old_investments oi
                WHERE oi.investor_profile_id = d.investor_profile_id
                  AND oi.email_address IS NOT NULL
                  AND LOWER(TRIM(i.email)) = LOWER(TRIM(oi.email_address))
              )
            )
        )
        ORDER BY d.created_at DESC
      `;
      oldDocsParams = [userId];
    }

    const oldDocsRes = await db.query(oldDocsQuery, oldDocsParams);
    const legacyDocs = oldDocsRes.rows.map((d: any) => ({
      id: d.id,
      file_name: d.file_name,
      file_url: d.file_url,
      document_type: d.document_type || 'Legacy Document',
      tax_year: d.tax_year,
      uploaded_at: d.created_at,
      investorName: d.investor_name || d.investor_profile_legal_name || 'Legacy Investor',
      is_legacy: true,
      s3_key: d.s3_key,
    }));

    return [...result.rows, ...legacyDocs];
  }

  async uploadFundDocument(fundId: string | null, data: {
    file_name: string;
    file_url: string;
    document_type: string;
    tax_year?: number;
    description?: string;
    note?: string;
    file_size?: number;
  }) {
    const result = await db.query(
      `INSERT INTO fund_documents (fund_id, file_name, file_url, document_type, tax_year, description, note, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        fundId,
        data.file_name,
        data.file_url,
        data.document_type,
        data.tax_year,
        data.description,
        data.note,
        data.file_size
      ]
    );
    return result.rows[0];
  }

  async uploadKycDocument(investorId: string, data: {
    file_name: string;
    file_url: string;
    document_type: string;
    file_size?: number;
    description?: string;
    tax_year?: number;
  }) {
    const result = await db.query(
      `INSERT INTO investor_documents (investor_id, file_name, file_url, document_type, file_size, description, tax_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        investorId,
        data.file_name,
        data.file_url,
        data.document_type,
        data.file_size,
        data.description,
        data.tax_year
      ]
    );
    return result.rows[0];
  }

  async getInvestorDocuments(investorId: string, requestingUserId?: string, requestingUserRole?: string) {
    // If accountant is requesting, verify they are assigned to this investor
    if (requestingUserRole === 'accountant' && requestingUserId) {
      const assignmentCheck = await db.query(
        'SELECT id FROM investors WHERE id = $1 AND assigned_accountant_id = $2',
        [investorId, requestingUserId]
      );
      if (assignmentCheck.rows.length === 0) {
        return []; // Or throw ForbiddenException, but returning empty list is safer for UI
      }
    }

    // If investor is requesting, verify it's their own ID
    if (requestingUserRole === 'investor' && requestingUserId && investorId !== requestingUserId) {
      return [];
    }

    const result = await db.query(
      `SELECT d.*, i.full_name as "investorName", i.profile_image_url as "investorAvatar"
       FROM investor_documents d
       JOIN investors i ON d.investor_id = i.id
       WHERE d.investor_id = $1 
       ORDER BY d.uploaded_at DESC`,
      [investorId]
    );
    return result.rows;
  }

  async getOldInvestorDocuments(searchTerm: string) {
    if (!searchTerm || !searchTerm.trim()) return [];

    const term = searchTerm.trim();
    let email = term;
    let legalName = term;
    let profileId: number | null = parseInt(term, 10);

    if (!isNaN(profileId)) {
      const invRes = await db.query(
        `SELECT DISTINCT email_address, investor_profile_legal_name 
         FROM old_investments 
         WHERE investor_profile_id = $1 
         LIMIT 1`,
        [profileId]
      );
      if (invRes.rows.length > 0) {
        if (invRes.rows[0].email_address) email = invRes.rows[0].email_address;
        if (invRes.rows[0].investor_profile_legal_name) legalName = invRes.rows[0].investor_profile_legal_name;
      }
    }

    const result = await db.query(
      `SELECT * FROM old_investor_documents 
       WHERE investor_profile_id::text = $1 
          OR email_address ILIKE $2 
          OR investor_profile_legal_name ILIKE $3
          OR email_address ILIKE $3
          OR investor_profile_legal_name ILIKE $2
       ORDER BY created_at DESC`,
      [term, `%${email}%`, `%${legalName}%`]
    );
    return result.rows;
  }

  async getOldInvestorDocumentById(id: string) {
    const result = await db.query('SELECT * FROM old_investor_documents WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getOldDocumentS3Stream(s3Key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'investor-portal-old-docs',
      Key: s3Key,
    });
    return await s3Client.send(command);
  }

  async getMyDocuments(investorId: string) {
    // Both fund documents (if applicable) and personal investor documents
    const investorDocs = await this.getInvestorDocuments(investorId);

    // Look up email & full_name from investors or users table
    let email = '';
    let fullName = '';

    const invRes = await db.query('SELECT email, full_name FROM investors WHERE id = $1', [investorId]);
    if (invRes.rows.length > 0) {
      email = invRes.rows[0].email || '';
      fullName = invRes.rows[0].full_name || '';
    } else {
      const userRes = await db.query("SELECT email, TRIM(CONCAT(first_name, ' ', last_name)) as full_name FROM users WHERE id = $1", [investorId]);
      if (userRes.rows.length > 0) {
        email = userRes.rows[0].email || '';
        fullName = userRes.rows[0].full_name || '';
      }
    }

    let legacyDocs: any[] = [];
    const searchStr = email || fullName || investorId;
    if (searchStr) {
      const oldDocs = await this.getOldInvestorDocuments(searchStr);
      legacyDocs = oldDocs.map((d: any) => ({
        id: d.id,
        file_name: d.file_name,
        file_url: d.file_url,
        document_type: d.document_type || 'Legacy Document',
        tax_year: d.tax_year,
        uploaded_at: d.created_at,
        is_legacy: true,
        s3_key: d.s3_key,
      }));
    }

    return [...investorDocs, ...legacyDocs];
  }

  async getDocumentById(id: string) {
    // First check fund_documents
    let result = await db.query('SELECT * FROM fund_documents WHERE id = $1', [id]);
    if (result.rowCount && result.rowCount > 0) {
      return result.rows[0];
    }

    // Then check investor_documents
    result = await db.query('SELECT * FROM investor_documents WHERE id = $1', [id]);
    if (result.rowCount && result.rowCount > 0) {
      return result.rows[0];
    }

    // Check old_investor_documents
    result = await db.query('SELECT * FROM old_investor_documents WHERE id = $1', [id]);
    if (result.rowCount && result.rowCount > 0) {
      return result.rows[0];
    }

    throw new NotFoundException('Document not found');
  }

  async updateDocument(id: string, data: {
    document_type?: string;
    tax_year?: number;
    description?: string;
    note?: string;
  }) {
    // Check which table the document belongs to
    const checkFund = await db.query('SELECT id FROM fund_documents WHERE id = $1', [id]);
    const isFundDoc = checkFund.rowCount && checkFund.rowCount > 0;
    const tableName = isFundDoc ? 'fund_documents' : 'investor_documents';

    const fields = [];
    const values = [];
    let i = 1;

    if (data.document_type !== undefined) {
      fields.push(`document_type = $${i++}`);
      values.push(data.document_type);
    }
    if (data.tax_year !== undefined && isFundDoc) {
      fields.push(`tax_year = $${i++}`);
      values.push(data.tax_year);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(data.description);
    }
    if (data.note !== undefined && isFundDoc) {
      fields.push(`note = $${i++}`);
      values.push(data.note);
    }

    if (fields.length === 0) {
      return this.getDocumentById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE ${tableName} SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );

    if (!result.rowCount || result.rowCount === 0) {
      throw new NotFoundException('Document not found');
    }
    return result.rows[0];
  }

  async updateDocumentWithFile(id: string, data: {
    file_name: string;
    file_url: string;
    file_size: number;
    document_type?: string;
    tax_year?: number;
    description?: string;
    note?: string;
  }) {
    const checkFund = await db.query('SELECT id FROM fund_documents WHERE id = $1', [id]);
    const isFundDoc = checkFund.rowCount && checkFund.rowCount > 0;
    const tableName = isFundDoc ? 'fund_documents' : 'investor_documents';

    const fields = [
      'file_name = $1',
      'file_url = $2',
      'file_size = $3'
    ];
    const values: any[] = [data.file_name, data.file_url, data.file_size];
    let i = 4;

    if (data.document_type !== undefined) {
      fields.push(`document_type = $${i++}`);
      values.push(data.document_type);
    }
    if (data.tax_year !== undefined && isFundDoc) {
      fields.push(`tax_year = $${i++}`);
      values.push(data.tax_year);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(data.description);
    }
    if (data.note !== undefined && isFundDoc) {
      fields.push(`note = $${i++}`);
      values.push(data.note);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE ${tableName} SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );

    if (!result.rowCount || result.rowCount === 0) {
      throw new NotFoundException('Document not found');
    }
    return result.rows[0];
  }

  async deleteDocument(id: string) {
    // Try deleting from both tables
    let result = await db.query('DELETE FROM fund_documents WHERE id = $1 RETURNING id', [id]);
    if (!result.rowCount || result.rowCount === 0) {
      result = await db.query('DELETE FROM investor_documents WHERE id = $1 RETURNING id', [id]);
    }

    if (!result.rowCount || result.rowCount === 0) {
      throw new NotFoundException('Document not found');
    }
    return { message: 'Document deleted successfully' };
  }


}
