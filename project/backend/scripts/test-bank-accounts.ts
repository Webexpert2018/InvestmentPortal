import { db } from '../src/config/database';

async function testBankAccounts() {
  const testInvestorId = '82667465-cf37-4109-9303-d966e3212ae5'; // Inv User

  try {
    console.log('--- Testing Database ---');
    const res = await db.query('SELECT * FROM user_bank_accounts');
    console.log('Bank accounts count:', res.rows.length);

    console.log('\n--- Creating Dummy Bank Account ---');
    const insertRes = await db.query(`
      INSERT INTO user_bank_accounts (
        user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [testInvestorId, 'investor', 'Test Bank', '12345678', '98765432', 'Test User', '123 Test St']);
    
    console.log('Inserted Account:', insertRes.rows[0]);

    console.log('\n--- Deleting Dummy Bank Account ---');
    await db.query('DELETE FROM user_bank_accounts WHERE id = $1', [insertRes.rows[0].id]);
    console.log('Account deleted successfully');

    console.log('\n✅ All tests passed!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    process.exit(0);
  }
}

testBankAccounts();
