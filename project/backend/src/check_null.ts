
import { db } from './config/database';

async function checkNullability() {
  try {
    const res = await db.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'fund_documents' AND column_name = 'fund_id'
    `);
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkNullability();
