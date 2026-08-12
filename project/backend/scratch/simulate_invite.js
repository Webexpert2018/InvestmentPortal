const { db } = require('../dist/config/database');

async function simulate() {
  try {
    // 1. Get all old investors
    const oldRes = await db.query(`
      SELECT oi.ims_profile_id, oi.legal_name, oi.primary_email
      FROM old_investors oi
    `);
    
    console.log(`Found ${oldRes.rows.length} old investors. Simulating invite validation...`);
    
    for (const row of oldRes.rows) {
      if (!row.primary_email) continue;
      const email = row.primary_email.toLowerCase().trim();
      
      // Simulate backend checks:
      const [existingUser, existingInvestor, existingStaff] = await Promise.all([
        db.query('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)', [email]),
        db.query('SELECT id, email, status FROM investors WHERE LOWER(email) = LOWER($1)', [email]),
        db.query('SELECT id, email FROM staff WHERE LOWER(email) = LOWER($1)', [email])
      ]);
      
      const inUser = existingUser.rows.length > 0;
      const inInvestor = existingInvestor.rows.length > 0;
      const inStaff = existingStaff.rows.length > 0;
      
      // Check if our isPresent query would match:
      // EXISTS(SELECT 1 FROM investors i WHERE LOWER(i.email) = LOWER(oi.primary_email))
      const isPresentQueryMatch = inInvestor;
      
      // Determine if inviteInvestor would fail:
      let wouldFail = false;
      let failReason = '';
      
      // Check users/staff:
      // In backend: db.query('SELECT id FROM users WHERE email = $1', [email]) -- note: case sensitive in original!
      // Let's check both case sensitive and case insensitive
      const existingUserCS = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
      const existingInvestorCS = await db.query('SELECT id, email, status FROM investors WHERE email = $1', [email]);
      const existingStaffCS = await db.query('SELECT id, email FROM staff WHERE email = $1', [email]);
      
      const inUserCS = existingUserCS.rows.length > 0;
      const inInvestorCS = existingInvestorCS.rows.length > 0;
      const inStaffCS = existingStaffCS.rows.length > 0;
      
      if (inUserCS || inStaffCS) {
        wouldFail = true;
        failReason = 'Exists in users/staff (Case Sensitive check)';
      } else if (inInvestorCS) {
        const inv = existingInvestorCS.rows[0];
        if (inv.status !== 'prospect') {
          wouldFail = true;
          failReason = `Exists in investors with status ${inv.status} (Case Sensitive check)`;
        }
      }
      
      // Check if there's a case-insensitive conflict that would cause DB unique constraint violation on insert/update:
      if (!wouldFail) {
        if (inUser || inStaff) {
          wouldFail = true;
          failReason = 'Case Insensitive conflict in users/staff (will fail on DB insert/update)';
        } else if (inInvestor) {
          wouldFail = true;
          failReason = 'Case Insensitive conflict in investors (will fail on DB insert/update)';
        }
      }
      
      if (wouldFail && !isPresentQueryMatch) {
        console.log(`❌ old_investor: [${row.ims_profile_id}] "${row.legal_name}" <${row.primary_email}>`);
        console.log(`   isPresent query: false (no green badge)`);
        console.log(`   Invite would fail: YES. Reason: ${failReason}`);
        console.log(`   User DB match:`, existingUser.rows);
        console.log(`   Investor DB match:`, existingInvestor.rows);
        console.log(`   Staff DB match:`, existingStaff.rows);
        console.log('--------------------------------------------------');
      }
    }
    console.log('Simulation finished.');
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}

simulate();
