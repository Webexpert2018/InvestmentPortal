import { db } from './src/config/database';
import { StatsService } from './src/modules/stats/stats.service';

async function debug() {
  const statsService = new StatsService();
  try {
    const userResult = await db.query('SELECT id FROM investors LIMIT 1');
    const fundResult = await db.query('SELECT id FROM funds LIMIT 1');
    const userId = userResult.rows[0].id;
    const fundId = fundResult.rows[0].id;

    console.log('--- Initial Stats ---');
    console.log(await statsService.getInvestorStats(userId));

    console.log('\n--- Creating New Investment (unreconciled) ---');
    const invRes = await db.query(`
      INSERT INTO investments (
        user_id, fund_id, investment_amount, processing_fee, total_amount, 
        unit_price, estimated_units, revised_amount, status, account_type, is_reconciled
      ) VALUES ($1, $2, 1000, 5, 1005, 1, 1000, 1000, 'Pending', 'Personal', NULL)
      RETURNING *
    `, [userId, fundId]);
    
    console.log('New Investment is_reconciled:', invRes.rows[0].is_reconciled);

    console.log('\n--- Stats After Investment ---');
    console.log(await statsService.getInvestorStats(userId));

    console.log('\n--- Reconciling Investment ---');
    await db.query('UPDATE investments SET is_reconciled = true WHERE id = $1', [invRes.rows[0].id]);
    
    console.log('\n--- Stats After Reconciliation ---');
    console.log(await statsService.getInvestorStats(userId));

    // Cleanup
    await db.query('DELETE FROM investments WHERE id = $1', [invRes.rows[0].id]);
    console.log('\nCleanup done.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

debug();
