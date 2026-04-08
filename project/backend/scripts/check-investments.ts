import { db } from '../src/config/database';

async function check() {
  try {
    const invs = await db.query('SELECT user_id, status FROM investments');
    console.log('Investments:', invs.rows);

    const users = await db.query('SELECT id, first_name, last_name, profile_image_url FROM users');
    console.log('Users:', JSON.stringify(users.rows, null, 2));

    const investors = await db.query('SELECT id, full_name, profile_image_url FROM investors');
    console.log('Investors:', JSON.stringify(investors.rows, null, 2));

    const finalJoin = await db.query(`
      SELECT 
        i.*, 
        f.name as fund_name, 
        COALESCE(u.first_name || ' ' || u.last_name, inv.full_name) as investor_name,
        COALESCE(u.profile_image_url, inv.profile_image_url) as avatar_url
      FROM investments i
      LEFT JOIN funds f ON i.fund_id = f.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN investors inv ON i.user_id = inv.id
      ORDER BY i.created_at DESC
    `);
    console.log('Final Join Result:', JSON.stringify(finalJoin.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
