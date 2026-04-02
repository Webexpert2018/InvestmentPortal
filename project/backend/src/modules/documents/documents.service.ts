import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class DocumentsService {
  async getFundDocuments(fundId: string) {
    const result = await db.query(
      'SELECT * FROM fund_documents WHERE fund_id = $1 ORDER BY uploaded_at DESC',
      [fundId]
    );
    return result.rows;
  }

  async getAllDocuments() {
    const result = await db.query(
      'SELECT * FROM fund_documents ORDER BY uploaded_at DESC'
    );
    return result.rows;
  }

  async uploadFundDocument(fundId: string, data: {
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

  async getDocumentById(id: string) {
    const result = await db.query('SELECT * FROM fund_documents WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Document not found');
    }
    return result.rows[0];
  }

  async updateDocument(id: string, data: {
    document_type?: string;
    tax_year?: number;
    description?: string;
    note?: string;
  }) {
    const fields = [];
    const values = [];
    let i = 1;

    if (data.document_type !== undefined) {
      fields.push(`document_type = $${i++}`);
      values.push(data.document_type);
    }
    if (data.tax_year !== undefined) {
      fields.push(`tax_year = $${i++}`);
      values.push(data.tax_year);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(data.description);
    }
    if (data.note !== undefined) {
      fields.push(`note = $${i++}`);
      values.push(data.note);
    }

    if (fields.length === 0) {
      return this.getDocumentById(id);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE fund_documents SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
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
    if (data.tax_year !== undefined) {
      fields.push(`tax_year = $${i++}`);
      values.push(data.tax_year);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(data.description);
    }
    if (data.note !== undefined) {
      fields.push(`note = $${i++}`);
      values.push(data.note);
    }

    values.push(id);
    const result = await db.query(
      `UPDATE fund_documents SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Document not found');
    }
    return result.rows[0];
  }

  async deleteDocument(id: string) {
    const result = await db.query('DELETE FROM fund_documents WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Document not found');
    }
    return { message: 'Document deleted successfully' };
  }
}
