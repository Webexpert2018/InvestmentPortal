const { Client } = require('pg');
require('dotenv').config();

async function cleanupInvestors() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('Keeping only the latest 5 investors...');
    
    // Delete all investors that are NOT in the top 5 (ordered by created_at)
    const res = await client.query(`
      DELETE FROM investors 
      WHERE id NOT IN (
        SELECT id FROM investors 
        ORDER BY created_at ASC 
        LIMIT 5
      );
    `);
    
    console.log(`Successfully deleted extra investors. Rows removed: ${res.rowCount}`);
    
    const countRes = await client.query("SELECT COUNT(*) FROM investors");
    console.log(`Current investor count: ${countRes.rows[0].count}`);

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await client.end();
  }
}

cleanupInvestors();
