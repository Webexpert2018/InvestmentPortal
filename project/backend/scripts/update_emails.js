const { Pool } = require('pg');

const localUrl = 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable';
const neonUrl = 'postgresql://neondb_owner:npg_4R9iFEyauPXH@ep-dawn-shadow-ammmohw4-pooler.c-5.us-east-1.aws.neon.tech/bitcoin_ira?sslmode=require';

async function updateDb(url, name) {
  console.log(`\nConnecting to ${name}...`);
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query("ALTER TABLE doctor_prospects DROP CONSTRAINT IF EXISTS doctor_prospects_email_key;");
    await pool.query("DROP INDEX IF EXISTS doctor_prospects_email_key;");
    const res = await pool.query("UPDATE doctor_prospects SET email = 'ishadubey343@gmail.com'");
    console.log(`✅ [${name}] Dropped email unique constraint and updated ${res.rowCount} prospect records!`);
  } catch (err) {
    console.error(`❌ [${name}] Error:`, err.message);
  } finally {
    await pool.end();
  }
}

async function run() {
  await updateDb(localUrl, 'Local Database');
  await updateDb(neonUrl, 'Neon Vercel Database');
}

run();
