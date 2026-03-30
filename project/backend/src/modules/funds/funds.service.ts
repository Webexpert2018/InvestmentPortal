import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class FundsService {
  async getAllFunds() {
    const result = await db.query(
      `SELECT f.id, f.name, f.description, f.image_url as image, f.start_date as "startDate", f.status, f.note,
              COALESCE(ff.total_investors, 0)::int as "totalInvestors",
              COALESCE(ff.total_aum, 0)::float as "totalAUM"
       FROM funds f
       LEFT JOIN (
           SELECT fund_id, COUNT(DISTINCT user_id) as total_investors, SUM(amount) as total_aum
           FROM fund_flows
           GROUP BY fund_id
       ) ff ON f.id = ff.fund_id
       ORDER BY f.name ASC`
    );
    return result.rows;
  }

  async getFundById(id: string) {
    const result = await db.query(
      `SELECT f.id, f.name, f.description, f.image_url as image, f.start_date as "startDate", f.status, f.note,
              COALESCE(ff.total_investors, 0)::int as "totalInvestors",
              COALESCE(ff.total_aum, 0)::float as "totalAUM"
       FROM funds f
       LEFT JOIN (
           SELECT fund_id, COUNT(DISTINCT user_id) as total_investors, SUM(amount) as total_aum
           FROM fund_flows
           GROUP BY fund_id
       ) ff ON f.id = ff.fund_id
       WHERE f.id = $1`,
      [id]
    );
    const fund = result.rows[0];
    if (!fund) {
      throw new NotFoundException('Fund not found');
    }
    return fund;
  }

  async createFund(data: { name: string; description: string; image_url: string; start_date?: string; status?: string; note?: string; min_investment?: number; unit_price?: number }) {
    const result = await db.query(
      'INSERT INTO funds (name, description, image_url, start_date, status, note, min_investment, unit_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        data.name, 
        data.description, 
        data.image_url, 
        data.start_date || new Date().toISOString().split('T')[0], 
        data.status || 'Active', 
        data.note || '',
        data.min_investment || 0, 
        data.unit_price || 1.00
      ]
    );
    return result.rows[0];
  }

  async updateFund(id: string, data: Partial<{ name: string; description: string; image_url: string; start_date: string; status: string; note: string; min_investment: number; unit_price: number }>) {
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
