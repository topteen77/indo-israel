const db = require('../database/db');

console.log('✅ Database initialized successfully');

const count = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
console.log('\n📊 Total jobs in database:', count.count);

const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status ORDER BY status').all();
console.log('\nJobs by Status:');
console.log('────────────────────────────────────────');
byStatus.forEach(row => console.log(`  ${row.status.padEnd(15)} ${row.count} jobs`));
console.log('────────────────────────────────────────');

const activeJobs = db.prepare('SELECT id, title, company, industry FROM jobs WHERE status = ? ORDER BY id LIMIT 20').all('active');
console.log('\n📋 First 20 Active Jobs:');
console.log('────────────────────────────────────────────────────────────────────────');
activeJobs.forEach(job => {
  console.log(`ID: ${job.id.toString().padStart(4)} | ${job.title.padEnd(40)} | ${job.industry || 'N/A'}`);
});
console.log('────────────────────────────────────────────────────────────────────────');

const allJobs = db.prepare('SELECT id, title, company, industry, status FROM jobs ORDER BY id').all();
if (allJobs.length > 0) {
  console.log(`\n📊 Job ID Range: ${allJobs[0].id} to ${allJobs[allJobs.length - 1].id}`);
  console.log(`   First job: "${allJobs[0].title}" (Status: ${allJobs[0].status})`);
  console.log(`   Last job: "${allJobs[allJobs.length - 1].title}" (Status: ${allJobs[allJobs.length - 1].status})`);
}
