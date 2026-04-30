import { db } from '../src/config/database';

async function testQuery() {
  const role = 'accountant';
  const limit = 100;
  const offset = 0;
  const searchPattern = null;
  const params = [role, limit, offset, searchPattern];

  const query = `
    WITH combined AS (
      SELECT id, first_name || ' ' || last_name as full_name, email, phone, role, status, 
              profile_image_url, created_at, updated_at,
              null as associated_fund_name, null as associated_fund_id
      FROM users 
      WHERE role = $1
      
      UNION ALL
      
      SELECT s.id, s.full_name, s.email, s.phone, s.role, s.status, 
              s.profile_image_url, s.created_at, s.updated_at,
              f.name as associated_fund_name, f.id as associated_fund_id
      FROM staff s
      LEFT JOIN funds f ON s.associated_fund_id = f.id
      WHERE s.role = $1
    )
    SELECT *, 
            CASE 
              WHEN role = 'accountant' THEN (SELECT COUNT(*) FROM investors i WHERE i.assigned_accountant_id = combined.id)::int
              ELSE (SELECT COUNT(*) FROM investors i WHERE i.assigned_ir_id = combined.id)::int
            END as assigned_investors_count,
            COUNT(*) OVER() AS total_count 
    FROM combined
    WHERE ($4::text IS NULL OR full_name ILIKE $4 OR email ILIKE $4)
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  try {
    const result = await db.query(query, params);
    console.log('Query Results:', result.rows);
    console.log('Count:', result.rows.length);
  } catch (err) {
    console.error('Query Failed:', err);
  } finally {
    process.exit(0);
  }
}

testQuery();
