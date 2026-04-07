const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('sslmode=disable') ? false : {
    rejectUnauthorized: false,
  },
});

const investors = [
  { firstName: 'James', lastName: 'Mango', email: 'james.mango@example.com', kyc: 'approved' },
  { firstName: 'Talan', lastName: 'Madsen', email: 'talan.madsen@example.com', kyc: 'approved' },
  { firstName: 'Terry', lastName: 'George', email: 'terry.george@example.com', kyc: 'pending' },
  { firstName: 'Omar', lastName: 'Calzoni', email: 'omar.calzoni@example.com', kyc: 'approved' },
  { firstName: 'Martin', lastName: 'Gouse', email: 'martin.gouse@example.com', kyc: 'rejected' },
  { firstName: 'Carter', lastName: 'George', email: 'carter.george@example.com', kyc: 'approved' },
  { firstName: 'Wilson', lastName: 'Westervelt', email: 'wilson.westervelt@example.com', kyc: 'approved' },
  { firstName: 'Sarah', lastName: 'Thompson', email: 'sarah.t@example.com', kyc: 'pending' },
  { firstName: 'Michael', lastName: 'Chen', email: 'm.chen@example.com', kyc: 'pending' },
  { firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.r@gmail.com', kyc: 'approved' },
  { firstName: 'David', lastName: 'Park', email: 'd.park@example.com', kyc: 'pending' },
  { firstName: 'Jennifer', lastName: 'Walsh', email: 'j.walsh@example.com', kyc: 'rejected' },
  { firstName: 'Robert', lastName: 'Martinez', email: 'r.martinez@example.com', kyc: 'pending' },
  { firstName: 'Lisa', lastName: 'Anderson', email: 'l.anderson@example.com', kyc: 'approved' },
  { firstName: 'James', lastName: 'Wilson', email: 'j.wilson@example.com', kyc: 'pending' },
  { firstName: 'Maria', lastName: 'Garcia', email: 'm.garcia@example.com', kyc: 'approved' },
  { firstName: 'Thomas', lastName: 'Brown', email: 't.brown@example.com', kyc: 'pending' },
  { firstName: 'Patricia', lastName: 'Taylor', email: 'p.taylor@example.com', kyc: 'rejected' },
  { firstName: 'Christopher', lastName: 'Lee', email: 'c.lee@example.com', kyc: 'pending' },
  { firstName: 'Barbara', lastName: 'Moore', email: 'b.moore@example.com', kyc: 'approved' },
  { firstName: 'Daniel', lastName: 'Harris', email: 'd.harris@example.com', kyc: 'pending' }
];

async function seed() {
  const passwordHash = await bcrypt.hash('Investor123!', 10);
  
  try {
    const client = await pool.connect();
    console.log('🔄 Seeding investors...');
    
    // First, clear existing mock investors to avoid duplicates if re-run
    // But keep the admin! 
    await client.query("DELETE FROM users WHERE role = 'investor' AND email LIKE '%@example.com'");
    
    for (const inv of investors) {
      await client.query(
        `INSERT INTO users (
          first_name, last_name, email, password_hash, role, status, kyc_status, 
          phone, address_line1, city, state, country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          inv.firstName, 
          inv.lastName, 
          inv.email, 
          passwordHash, 
          'investor', 
          'active', 
          inv.kyc,
          '+1-555-010' + Math.floor(Math.random() * 9),
          '123 Investment Way',
          'New York',
          'NY',
          'USA'
        ]
      );
    }
    
    console.log(`✅ Successfully seeded ${investors.length} investors.`);
    client.release();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
