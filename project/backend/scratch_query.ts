import { db } from './src/config/database';

async function test() {
  try {
    const res = await db.query('SELECT * FROM pipeline_stages ORDER BY order_index ASC');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
