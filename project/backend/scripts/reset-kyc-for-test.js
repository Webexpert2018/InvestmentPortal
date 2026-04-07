const { db } = require('../src/config/database');

async function resetKyc() {
  try {
    const res = await db.query(
      "UPDATE investors SET kyc_status = 'unverified' WHERE email = 'defapev931@parsitv.com' RETURNING *"
    );
    console.log('✅ Status Reset for James Potter:', res.rows[0].kyc_status);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

resetKyc();
