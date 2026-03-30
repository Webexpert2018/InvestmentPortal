import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class FundFlowsService {
  async getFlowsByUser(userId: string) {
    const result = await db.query(
      `SELECT ff.id, ff.user_id, ff.fund_id, ff.account_id as "accountId", ff.amount, ff.status, ff.created_at, ff.updated_at,
              f.name as "fundName", f.image_url as "fundImage"
       FROM fund_flows ff
       JOIN funds f ON ff.fund_id = f.id
       WHERE ff.user_id = $1
       ORDER BY ff.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getAllFlows() {
    const result = await db.query(
      `SELECT ff.id, ff.user_id, ff.fund_id, ff.account_id as "accountId", ff.amount, ff.status, ff.created_at, ff.updated_at,
              f.name as "fundName", u.email as "userEmail", u.first_name as "userFirstName", u.last_name as "userLastName"
       FROM fund_flows ff
       JOIN funds f ON ff.fund_id = f.id
       JOIN users u ON ff.user_id = u.id
       ORDER BY ff.created_at DESC`
    );
    return result.rows;
  }

  async createFlow(userId: string, data: { fundId: string; accountId: string; amount: number; status?: string }) {
    const result = await db.query(
      'INSERT INTO fund_flows (user_id, fund_id, account_id, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, data.fundId, data.accountId, data.amount, data.status || 'Subscription Submitted']
    );
    return result.rows[0];
  }

  async updateFlowStatus(id: string, status: string) {
    const result = await db.query(
      'UPDATE fund_flows SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('Fund flow not found');
    }
    return result.rows[0];
  }

  async deleteFlow(id: string) {
    const result = await db.query('DELETE FROM fund_flows WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Fund flow not found');
    }
    return { message: 'Fund flow deleted successfully' };
  }
}
