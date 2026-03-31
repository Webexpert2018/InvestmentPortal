import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class InvestmentsService {
  async createInvestment(userId: string, data: any) {
    const { fundId, accountId, accountType, investmentAmount, unitPrice, status, documentSigned } = data;

    try {
      // Calculate processing fee (0.5% fixed for now)
      const processingFee = Number((investmentAmount * 0.005).toFixed(2));
      const totalAmount = Number((investmentAmount + processingFee).toFixed(2));
      const estimatedUnits = Number((investmentAmount / unitPrice).toFixed(4));

      const query = `
        INSERT INTO investments (
          user_id, fund_id, account_id, account_type, 
          investment_amount, processing_fee, total_amount, 
          unit_price, estimated_units, status, document_signed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        userId, fundId, accountId || null, accountType, 
        investmentAmount, processingFee, totalAmount, 
        unitPrice, estimatedUnits, 
        status || 'Subscription Submitted',
        documentSigned || false
      ];

      const result = await db.query(query, values);
      const investment = result.rows[0];

      // Add audit log
      try {
        await db.query(
          'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)',
          [
            userId,
            'CREATE_INVESTMENT',
            'investment',
            investment.id,
            JSON.stringify({ 
              amount: investmentAmount, 
              fund_id: fundId,
              status: status || 'Subscription Submitted'
            })
          ]
        );
      } catch (auditError) {
        console.warn('⚠️ Failed to create audit log for investment:', auditError);
        // Don't fail the whole request if audit logging fails
      }

      return investment;
    } catch (error) {
      console.error('❌ Error creating investment:', error);
      throw new InternalServerErrorException('Failed to create investment');
    }
  }

  async getMyInvestments(userId: string) {
    try {
      const query = `
        SELECT i.*, f.name as fund_name 
        FROM investments i
        JOIN funds f ON i.fund_id = f.id
        WHERE i.user_id = $1
        ORDER BY i.created_at DESC
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching investments:', error);
      throw new InternalServerErrorException('Failed to fetch investments');
    }
  }

  async updateInvestmentStatus(userId: string, investmentId: string, data: any) {
    const { status, documentSigned } = data;
    
    try {
      let query = 'UPDATE investments SET updated_at = CURRENT_TIMESTAMP';
      const values: any[] = [];
      let paramCount = 1;

      if (status !== undefined) {
        query += `, status = $${paramCount++}`;
        values.push(status);
      }

      if (documentSigned !== undefined) {
        query += `, document_signed = $${paramCount++}`;
        values.push(documentSigned);
        if (documentSigned) {
          query += `, signed_at = CURRENT_TIMESTAMP`;
        }
      }

      query += ` WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`;
      values.push(investmentId, userId);

      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        throw new NotFoundException('Investment not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error updating investment:', error);
      throw new InternalServerErrorException('Failed to update investment');
    }
  }

  async getInvestmentById(userId: string, investmentId: string) {
    try {
      const query = `
        SELECT i.*, f.name as fund_name 
        FROM investments i
        JOIN funds f ON i.fund_id = f.id
        WHERE i.id = $1 AND i.user_id = $2
      `;
      const result = await db.query(query, [investmentId, userId]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Investment not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error fetching investment:', error);
      throw new InternalServerErrorException('Failed to fetch investment');
    }
  }
}
