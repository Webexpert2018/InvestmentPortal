import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class StatsService {
  async getAdminStats() {
    try {
      const [investorsCount, pendingKycCount, pendingFundingsCount, pendingRedemptionsCount, financialTotals, recentInvestorsResult] = await Promise.all([
        db.query("SELECT COUNT(*) FROM investors"),
        db.query("SELECT COUNT(*) FROM investors WHERE kyc_status = 'pending'"),
        db.query("SELECT COUNT(*) FROM investments WHERE status IN ('Subscription Submitted', 'Awaiting Funding')"),
        db.query("SELECT COUNT(*) FROM redemptions WHERE status = 'Pending'"),
        db.query(`
          WITH reconciled_investments AS (
            SELECT 
              SUM(estimated_units) as total_units,
              SUM(COALESCE(revised_amount, investment_amount)) as total_value
            FROM investments 
            WHERE is_reconciled = true
          ),
          reconciled_redemptions AS (
            SELECT 
              SUM(units) as total_redeemed_units,
              SUM(amount) as total_redeemed_value
            FROM redemptions
            WHERE is_reconciled = true
          )
          SELECT 
            (COALESCE(inv.total_units, 0) - COALESCE(red.total_redeemed_units, 0)) as total_units,
            (COALESCE(inv.total_value, 0) - COALESCE(red.total_redeemed_value, 0)) as total_value
          FROM (SELECT 1) dummy
          LEFT JOIN reconciled_investments inv ON true
          LEFT JOIN reconciled_redemptions red ON true
        `),
        db.query(`
          SELECT 
            i.id,
            COALESCE(inv.full_name, u.first_name || ' ' || u.last_name) as investor_name,
            i.account_type,
            COALESCE(inv.kyc_status, 'verified') as kyc_status,
            i.status as funding_status,
            i.created_at
          FROM investments i
          LEFT JOIN funds f ON i.fund_id = f.id
          LEFT JOIN investors inv ON i.user_id = inv.id
          LEFT JOIN users u ON i.user_id = u.id
          ORDER BY i.created_at DESC
          LIMIT 5
        `)
      ]);

      return {
        totalInvestors: parseInt(investorsCount.rows[0]?.count || '0'),
        pendingKyc: parseInt(pendingKycCount.rows[0]?.count || '0'),
        pendingFundings: parseInt(pendingFundingsCount.rows[0]?.count || '0'),
        pendingRedemptions: parseInt(pendingRedemptionsCount.rows[0]?.count || '0'),
        totalUnits: parseFloat(financialTotals.rows[0]?.total_units || '0'),
        totalInvestmentValue: parseFloat(financialTotals.rows[0]?.total_value || '0'),
        recentInvestors: recentInvestorsResult.rows.map(row => ({
          id: row.id,
          investorName: row.investor_name,
          accountType: row.account_type,
          kycStatus: row.kyc_status,
          fundingStatus: row.funding_status,
          createdAt: row.created_at
        }))
      };
    } catch (error) {
      console.error('❌ Error fetching admin stats:', error);
      throw new InternalServerErrorException('Failed to fetch admin statistics');
    }
  }

  async getInvestorStats(userId: string) {
    try {
      const result = await db.query(`
        WITH reconciled_investments AS (
          SELECT 
            SUM(COALESCE(revised_amount, investment_amount)) as total_value,
            SUM(estimated_units) as total_units,
            SUM(investment_amount) as total_invested
          FROM investments
          WHERE user_id = $1 AND is_reconciled = true
        ),
        reconciled_redemptions AS (
          SELECT 
            SUM(amount) as total_redeemed_value,
            SUM(units) as total_redeemed_units
          FROM redemptions
          WHERE investor_id = $1 AND is_reconciled = true
        )
        SELECT 
          (COALESCE(inv.total_value, 0) - COALESCE(red.total_redeemed_value, 0)) as total_value,
          (COALESCE(inv.total_units, 0) - COALESCE(red.total_redeemed_units, 0)) as total_units,
          (COALESCE(inv.total_invested, 0) - COALESCE(red.total_redeemed_value, 0)) as total_invested
        FROM (SELECT 1) dummy
        LEFT JOIN reconciled_investments inv ON true
        LEFT JOIN reconciled_redemptions red ON true
      `, [userId]);

      const { total_value, total_units, total_invested } = result.rows[0];
      
      const totalValue = parseFloat(total_value);
      const totalInvested = parseFloat(total_invested);
      const ytdReturn = totalInvested > 0 
        ? ((totalValue - totalInvested) / totalInvested) * 100 
        : 0;

      return {
        totalValue,
        totalUnits: parseFloat(total_units),
        totalInvested: parseFloat(total_invested),
        ytdReturn: parseFloat(ytdReturn.toFixed(2))
      };
    } catch (error) {
      console.error('❌ Error fetching investor stats:', error);
      throw new InternalServerErrorException('Failed to fetch investor statistics');
    }
  }
}
