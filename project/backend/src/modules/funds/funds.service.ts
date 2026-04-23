import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class FundsService {
  async getAllFunds() {
    const result = await db.query(
      `SELECT f.id, f.name, f.description, f.image_url as image, f.start_date as "startDate", f.status, f.note,
              f.bank_name as "bankName", f.account_number as "accountNumber", f.routing_number as "routingNumber", 
              f.beneficiary_name as "beneficiaryName", f.bank_address as "bankAddress",
              COALESCE(stats.total_investors, 0)::int as "totalInvestors",
              COALESCE(stats.total_aum, 0)::float as "totalAUM"
       FROM funds f
       LEFT JOIN (
           SELECT fund_id, COUNT(DISTINCT user_id) as total_investors, SUM(amount) as total_aum
           FROM (
               SELECT fund_id, user_id, amount FROM fund_flows
               UNION ALL
               SELECT fund_id, user_id, investment_amount as amount FROM investments
               WHERE is_reconciled = true
               UNION ALL
               SELECT inv.fund_id, r.investor_id as user_id, -r.amount as amount FROM redemptions r
               JOIN investments inv ON r.investment_id = inv.id
               WHERE r.is_reconciled = true
           ) combined
           GROUP BY fund_id
       ) stats ON f.id = stats.fund_id
       ORDER BY f.name ASC`
    );
    return result.rows;
  }

  async getFundById(id: string) {
    const result = await db.query(
      `SELECT f.id, f.name, f.description, f.image_url as image, f.start_date as "startDate", f.status, f.note,
              f.bank_name as "bankName", f.account_number as "accountNumber", f.routing_number as "routingNumber", 
              f.beneficiary_name as "beneficiaryName", f.bank_address as "bankAddress",
              COALESCE(stats.total_investors, 0)::int as "totalInvestors",
              COALESCE(stats.total_aum, 0)::float as "totalAUM"
       FROM funds f
       LEFT JOIN (
           SELECT fund_id, COUNT(DISTINCT user_id) as total_investors, SUM(amount) as total_aum
           FROM (
               SELECT fund_id, user_id, amount FROM fund_flows
               UNION ALL
               SELECT fund_id, user_id, investment_amount as amount FROM investments
               WHERE is_reconciled = true
               UNION ALL
               SELECT inv.fund_id, r.investor_id as user_id, -r.amount as amount FROM redemptions r
               JOIN investments inv ON r.investment_id = inv.id
               WHERE r.is_reconciled = true
           ) combined
           GROUP BY fund_id
       ) stats ON f.id = stats.fund_id
       WHERE f.id = $1`,
      [id]
    );
    const fund = result.rows[0];
    if (!fund) {
      throw new NotFoundException('Fund not found');
    }
    return fund;
  }

  async createFund(data: { 
    name: string; 
    description: string; 
    image_url: string; 
    start_date?: string; 
    status?: string; 
    note?: string; 
    min_investment?: number; 
    unit_price?: number;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    beneficiaryName?: string;
    bankAddress?: string;
  }) {
    const result = await db.query(
      `INSERT INTO funds (
        name, description, image_url, start_date, status, note, 
        min_investment, unit_price, bank_name, account_number, 
        routing_number, beneficiary_name, bank_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        data.name, 
        data.description, 
        data.image_url, 
        data.start_date || new Date().toISOString().split('T')[0], 
        data.status || 'Active', 
        data.note || '',
        data.min_investment || 0, 
        data.unit_price || 1.00,
        data.bankName || null,
        data.accountNumber || null,
        data.routingNumber || null,
        data.beneficiaryName || null,
        data.bankAddress || null
      ]
    );
    return result.rows[0];
  }

  async updateFund(id: string, data: Partial<{ 
    name: string; 
    description: string; 
    image_url: string; 
    start_date: string; 
    status: string; 
    note: string; 
    min_investment: number; 
    unit_price: number;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    beneficiaryName: string;
    bankAddress: string;
  }>) {
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(data.image_url);
    }
    if (data.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(data.start_date);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.note !== undefined) {
      updates.push(`note = $${paramIndex++}`);
      values.push(data.note);
    }
    if (data.min_investment !== undefined) {
      updates.push(`min_investment = $${paramIndex++}`);
      values.push(data.min_investment);
    }
    if (data.unit_price !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`);
      values.push(data.unit_price);
    }
    if (data.bankName !== undefined) {
      updates.push(`bank_name = $${paramIndex++}`);
      values.push(data.bankName);
    }
    if (data.accountNumber !== undefined) {
      updates.push(`account_number = $${paramIndex++}`);
      values.push(data.accountNumber);
    }
    if (data.routingNumber !== undefined) {
      updates.push(`routing_number = $${paramIndex++}`);
      values.push(data.routingNumber);
    }
    if (data.beneficiaryName !== undefined) {
      updates.push(`beneficiary_name = $${paramIndex++}`);
      values.push(data.beneficiaryName);
    }
    if (data.bankAddress !== undefined) {
      updates.push(`bank_address = $${paramIndex++}`);
      values.push(data.bankAddress);
    }

    if (values.length === 0) return this.getFundById(id);

    values.push(id);
    const result = await db.query(
      `UPDATE funds SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Fund not found');
    }
    return result.rows[0];
  }

  async deleteFund(id: string) {
    const result = await db.query('DELETE FROM funds WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Fund not found');
    }
    return { message: 'Fund deleted successfully' };
  }
}
