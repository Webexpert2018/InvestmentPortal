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
          SELECT 
            COALESCE(SUM(estimated_units), 0) as total_units,
            COALESCE(SUM(COALESCE(revised_amount, investment_amount)), 0) as total_value
          FROM investments 
          WHERE is_reconciled = true
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
        totalInvestors: parseInt(investorsCount.rows[0].count),
        pendingKyc: parseInt(pendingKycCount.rows[0].count),
        pendingFundings: parseInt(pendingFundingsCount.rows[0].count),
        pendingRedemptions: parseInt(pendingRedemptionsCount.rows[0].count),
        totalUnits: parseFloat(financialTotals.rows[0].total_units),
        totalInvestmentValue: parseFloat(financialTotals.rows[0].total_value),
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
        SELECT 
          COALESCE(SUM(COALESCE(revised_amount, investment_amount)), 0) as total_value,
          COALESCE(SUM(estimated_units), 0) as total_units,
          COALESCE(SUM(investment_amount), 0) as total_invested
        FROM investments
        WHERE user_id = $1 AND status NOT IN ('Cancelled', 'Rejected', 'Declined')
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
