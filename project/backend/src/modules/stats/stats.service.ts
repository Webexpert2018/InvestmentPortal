import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class StatsService {
  async getAdminStats() {
    try {
      const [investorsCount, pendingKycCount, pendingFundingsCount, pendingRedemptionsCount, financialTotals, recentInvestorsResult] = await Promise.all([
        db.query("SELECT COUNT(*) FROM investors WHERE status = 'active'"),
        db.query("SELECT COUNT(*) FROM investors WHERE kyc_status IN ('pending', 'unverified')"),
        db.query("SELECT COUNT(*) FROM investments WHERE status != 'Units Issued'"),
        db.query("SELECT COUNT(*) FROM redemptions WHERE status != 'Processed'"),
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
            i.user_id as id,
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

  async getInvestorPerformance(userId: string, months: number = 12) {
    try {
      // 1. Get all NAV history
      const navHistory = await db.query(
        `SELECT effective_date, nav_per_unit 
         FROM fund_nav_history 
         WHERE effective_date >= NOW() - ($1 || ' months')::INTERVAL
         ORDER BY effective_date ASC`,
        [months.toString()]
      );

      // 2. Get all reconciled investments for this user in the interval
      const investments = await db.query(
        `SELECT created_at, investment_amount, estimated_units 
         FROM investments 
         WHERE user_id = $1 AND is_reconciled = true AND created_at >= NOW() - ($2 || ' months')::INTERVAL
         ORDER BY created_at ASC`,
        [userId, months.toString()]
      );

      // 3. Get all reconciled redemptions for this user in the interval
      const redemptions = await db.query(
        `SELECT created_at, amount, units 
         FROM redemptions 
         WHERE investor_id = $1 AND is_reconciled = true AND created_at >= NOW() - ($2 || ' months')::INTERVAL
         ORDER BY created_at ASC`,
        [userId, months.toString()]
      );

      // 4. Get the latest NAV before the interval start
      const initialNavResult = await db.query(
        `SELECT nav_per_unit FROM fund_nav_history 
         WHERE effective_date < NOW() - ($1 || ' months')::INTERVAL
         ORDER BY effective_date DESC LIMIT 1`,
        [months.toString()]
      );
      let currentNav = initialNavResult.rows[0] ? parseFloat(initialNavResult.rows[0].nav_per_unit) : 0;

      // Combine all events
      const allEvents = [
        ...navHistory.rows.map(r => ({ type: 'nav', date: new Date(r.effective_date), value: parseFloat(r.nav_per_unit) })),
        ...investments.rows.map(r => ({ type: 'investment', date: new Date(r.created_at), amount: parseFloat(r.investment_amount), units: parseFloat(r.estimated_units) })),
        ...redemptions.rows.map(r => ({ type: 'redemption', date: new Date(r.created_at), amount: parseFloat(r.amount), units: parseFloat(r.units) }))
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      const dataPoints = [];
      let currentUnits = 0;
      let currentInvested = 0;

      // Initial state before the requested interval
      const initialStats = await db.query(`
        WITH prev_investments AS (
          SELECT SUM(investment_amount) as total_invested, SUM(estimated_units) as total_units
          FROM investments
          WHERE user_id = $1 AND is_reconciled = true AND created_at < NOW() - ($2 || ' months')::INTERVAL
        ),
        prev_redemptions AS (
          SELECT SUM(amount) as total_redeemed_value, SUM(units) as total_redeemed_units
          FROM redemptions
          WHERE investor_id = $1 AND is_reconciled = true AND created_at < NOW() - ($2 || ' months')::INTERVAL
        )
        SELECT 
          (COALESCE(inv.total_invested, 0) - COALESCE(red.total_redeemed_value, 0)) as start_invested,
          (COALESCE(inv.total_units, 0) - COALESCE(red.total_redeemed_units, 0)) as start_units
        FROM (SELECT 1) dummy
        LEFT JOIN prev_investments inv ON true
        LEFT JOIN prev_redemptions red ON true
      `, [userId, months.toString()]);

      currentInvested = parseFloat(initialStats.rows[0]?.start_invested || '0');
      currentUnits = parseFloat(initialStats.rows[0]?.start_units || '0');

      // If there's an initial state, add a starting point at the beginning of the interval
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      dataPoints.push({
        date: startDate.toISOString(),
        totalInvested: currentInvested,
        currentValue: currentUnits * currentNav,
      });

      for (const event of allEvents as any[]) {
        if (event.type === 'nav') {
          currentNav = event.value;
        } else if (event.type === 'investment') {
          currentUnits += event.units;
          currentInvested += event.amount;
        } else if (event.type === 'redemption') {
          currentUnits -= event.units;
          currentInvested -= event.amount;
        }

        dataPoints.push({
          date: event.date.toISOString(),
          totalInvested: currentInvested,
          currentValue: currentUnits * currentNav,
        });
      }

      // Add a final point for "today" using the absolute latest NAV
      const latestNavResult = await db.query(
        "SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1"
      );
      const latestNav = latestNavResult.rows[0] ? parseFloat(latestNavResult.rows[0].nav_per_unit) : currentNav;

      const now = new Date().toISOString();
      dataPoints.push({
        date: now,
        totalInvested: currentInvested,
        currentValue: currentUnits * latestNav,
      });

      return dataPoints;
    } catch (error) {
      console.error('❌ Error fetching investor performance:', error);
      throw new InternalServerErrorException('Failed to fetch investor performance');
    }
  }
}
