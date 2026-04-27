import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvestmentsService {
  constructor(private readonly notificationsService: NotificationsService) { }
  async createInvestment(userId: string, data: any) {
    const {
      fundId, accountId, accountType, investmentAmount, unitPrice, status,
      documentSigned, awaitingFunding, fundsReceived, unitsIssued
    } = data;

    try {
      // 1. Fetch latest active NAV to ensure price accuracy
      const navResult = await db.query(
        `SELECT nav_per_unit FROM fund_nav_history 
         WHERE status = 'active' 
         ORDER BY effective_date DESC 
         LIMIT 1`
      );

      if (navResult.rows.length === 0) {
        throw new BadRequestException('The fund is currently not accepting new investments (No active NAV found).');
      }

      const activeUnitPrice = parseFloat(navResult.rows[0].nav_per_unit);

      // 2. Calculate processing fee (0.5% fixed) and units
      const processingFee = Number((investmentAmount * 0.005).toFixed(2));
      const totalAmount = Number((investmentAmount + processingFee).toFixed(2));
      const estimatedUnits = Number((investmentAmount / activeUnitPrice).toFixed(8));
      const unitPrice = activeUnitPrice;

      const query = `
        INSERT INTO investments (
          user_id, fund_id, account_id, account_type, 
        investment_amount, processing_fee, total_amount, 
        unit_price, estimated_units, revised_amount, status, document_signed,
        awaiting_funding, funds_received, units_issued,
        awaiting_funding_at, signed_at, is_reconciled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NULL)
        RETURNING *
      `;

      const values = [
        userId, fundId, accountId || null, accountType,
        investmentAmount, processingFee, totalAmount,
        unitPrice, estimatedUnits,
        investmentAmount, // revised_amount initially matches investment_amount
        status || 'Subscription Submitted',
        documentSigned || false,
        awaitingFunding || false,
        fundsReceived || false,
        unitsIssued || false,
        (awaitingFunding || status === 'Awaiting Funding') ? new Date() : null,
        (documentSigned) ? new Date() : null
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

      // Notify admin/staff about new fund request
      this.notificationsService.createNotification({
        targetRole: 'executive_admin',
        title: 'New Fund Request Submitted',
        description: `A new fund subscription of $${investmentAmount.toLocaleString()} has been submitted. Review and process it.`,
        type: 'fund_request',
        link: `/dashboard/funding-requests/${investment.id}`
      }).catch(err => console.error('Failed to create fund request notification:', err));

      return investment;
    } catch (error: any) {
      console.error('❌ Error creating investment:', error);
      throw new InternalServerErrorException(error.message || 'Failed to create investment');
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

  async updateInvestmentStatus(userId: string, investmentId: string, data: any, role?: string) {
    const { status, documentSigned } = data;
    const isAdmin = ['admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant'].includes(role || '');

    try {
      let query = 'UPDATE investments SET updated_at = CURRENT_TIMESTAMP';
      const values: any[] = [];
      let paramCount = 1;

      if (status !== undefined) {
        query += `, status = $${paramCount++}`;
        values.push(status);

        // Auto-update tracking fields based on status
        if (status === 'Awaiting Funding') {
          query += `, awaiting_funding = TRUE, awaiting_funding_at = COALESCE(awaiting_funding_at, CURRENT_TIMESTAMP)`;
        } else if (status === 'Funds Received') {
          query += `, funds_received = TRUE, funds_received_at = COALESCE(funds_received_at, CURRENT_TIMESTAMP)`;
        } else if (status === 'Units Issued') {
          query += `, units_issued = TRUE, units_issued_at = COALESCE(units_issued_at, CURRENT_TIMESTAMP)`;
        }
      }

      if (documentSigned !== undefined) {
        query += `, document_signed = $${paramCount++}`;
        values.push(documentSigned);
        if (documentSigned) {
          query += `, signed_at = COALESCE(signed_at, CURRENT_TIMESTAMP)`;
          // Moving to next step automatically
          if (status === undefined) {
            query += `, status = 'Awaiting Funding', awaiting_funding = TRUE, awaiting_funding_at = COALESCE(awaiting_funding_at, CURRENT_TIMESTAMP)`;
          }
        }
      }

      query += ` WHERE id = $${paramCount++} ${isAdmin ? '' : 'AND user_id = $' + paramCount++} RETURNING *`;
      values.push(investmentId);
      if (!isAdmin) values.push(userId);

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

  async getInvestmentById(userId: string, investmentId: string, role?: string) {
    try {
      const isAdmin = ['admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant'].includes(role || '');
      const query = `
        SELECT 
          i.*, 
          f.name as fund_name, 
          f.description as fund_description,
          f.bank_name,
          f.account_number,
          f.routing_number,
          f.beneficiary_name,
          f.bank_address,
          COALESCE(u.first_name || ' ' || u.last_name, inv.full_name) as investor_name,
          COALESCE(u.email, inv.email) as email,
          ira.custodian_name
        FROM investments i
        JOIN funds f ON i.fund_id = f.id
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN investors inv ON i.user_id = inv.id
        LEFT JOIN ira_accounts ira ON i.user_id = ira.user_id
        WHERE i.id = $1 ${isAdmin ? '' : 'AND i.user_id = $2'}
      `;
      const params = isAdmin ? [investmentId] : [investmentId, userId];
      const result = await db.query(query, params);

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

  async getAllInvestments() {
    try {
      const query = `
        SELECT 
          i.*, 
          f.name as fund_name, 
          COALESCE(u.first_name || ' ' || u.last_name, inv.full_name) as investor_name,
          COALESCE(u.profile_image_url, inv.profile_image_url) as avatar_url
        FROM investments i
        LEFT JOIN funds f ON i.fund_id = f.id
        LEFT JOIN users u ON i.user_id = u.id
        LEFT JOIN investors inv ON i.user_id = inv.id
        ORDER BY i.created_at DESC
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching all investments:', error);
      throw new InternalServerErrorException('Failed to fetch all investments');
    }
  }

  async updateAllRevisedAmounts(manualNav?: number) {
    try {
      let currentNav = manualNav;

      if (currentNav === undefined) {
        // 1. Fetch latest active NAV
        const navResult = await db.query(
          `SELECT nav_per_unit FROM fund_nav_history 
           WHERE status = 'active' 
           ORDER BY effective_date DESC 
           LIMIT 1`
        );

        if (navResult.rows.length === 0) return;
        currentNav = parseFloat(navResult.rows[0].nav_per_unit);
      }

      // 2. Update all investments: current_value = units * current_nav
      // We use ROUND to ensure 2 decimal precision for the dollar amount
      const query = `
        UPDATE investments 
        SET revised_amount = ROUND(estimated_units * $1, 2),
            updated_at = CURRENT_TIMESTAMP
      `;
      await db.query(query, [currentNav]);

      console.log(`✅ Successfully updated all investment revised amounts to NAV: $${currentNav}`);
    } catch (error) {
      console.error('❌ Failed to update revised amounts:', error);
      throw error;
    }
  }

  async updateInternalAmount(investmentId: string, amount: number) {
    try {
      const query = `
        UPDATE investments 
        SET internal_amount = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;
      const result = await db.query(query, [amount, investmentId]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Investment not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error updating internal amount for investment:', error);
      throw new InternalServerErrorException('Failed to update internal amount');
    }
  }

  async markAsReconciled(investmentId: string, isReconciled: boolean) {
    try {
      const query = `
        UPDATE investments 
        SET is_reconciled = $1, 
            status = CASE WHEN $1 = true THEN 'Units Issued' ELSE status END,
            units_issued = CASE WHEN $1 = true THEN true ELSE units_issued END,
            units_issued_at = CASE WHEN $1 = true THEN COALESCE(units_issued_at, CURRENT_TIMESTAMP) ELSE units_issued_at END,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;
      const result = await db.query(query, [isReconciled, investmentId]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Investment not found');
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('❌ Error marking investment as reconciled:', error);
      throw new InternalServerErrorException('Failed to update reconciliation status');
    }
  }
}
