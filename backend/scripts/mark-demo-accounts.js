const db = require('../database/db');

/**
 * Mark existing users as demo accounts
 * This script updates users that match the demo account emails to be marked as demo accounts
 */
function markDemoAccounts() {
  console.log('🔄 Marking demo accounts...\n');

  const demoAccountEmails = [
    'employer@israel.com',    // David Cohen
    'worker@india.com',       // Rajesh Kumar
    'employer2@israel.com',   // Sarah Levy
    'worker2@india.com',      // Amit Sharma
    'worker3@india.com'       // Priya Patel
  ];

  const updateUser = db.prepare(`
    UPDATE users 
    SET is_demo_account = 1, demo_password = NULL 
    WHERE email = ?
  `);

  let updated = 0;
  for (const email of demoAccountEmails) {
    try {
      const result = updateUser.run(email);
      if (result.changes > 0) {
        console.log(`✅ Marked ${email} as demo account`);
        updated++;
      } else {
        console.log(`⚠️  User ${email} not found`);
      }
    } catch (e) {
      console.error(`❌ Error updating ${email}:`, e.message);
    }
  }

  console.log(`\n✅ Updated ${updated} users as demo accounts`);
  
  // Verify
  const demoUsers = db.prepare('SELECT email, fullName, name, role FROM users WHERE is_demo_account = 1').all();
  console.log(`\n📊 Total demo accounts in database: ${demoUsers.length}`);
  if (demoUsers.length > 0) {
    console.log('Demo accounts:');
    demoUsers.forEach(u => {
      console.log(`   - ${u.fullName || u.name || u.email} (${u.role})`);
    });
  }
}

// Run if called directly
if (require.main === module) {
  markDemoAccounts();
}

module.exports = { markDemoAccounts };
