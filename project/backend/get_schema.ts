import { db } from './src/config/database';

async function run() {
  try {
    const result = await db.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.table(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
