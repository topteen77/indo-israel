const db = require('../database/db');

// Get total count
const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
console.log(`\n📊 Total jobs in database: ${totalJobs.count}\n`);

// Get count by industry
const byIndustry = db.prepare(`
  SELECT industry, COUNT(*) as count 
  FROM jobs 
  GROUP BY industry 
  ORDER BY industry
`).all();

console.log('Jobs by Industry:');
console.log('─'.repeat(40));
byIndustry.forEach(row => {
  const industry = row.industry || 'Not specified';
  console.log(`  ${industry.padEnd(30)} ${row.count} job${row.count !== 1 ? 's' : ''}`);
});
console.log('─'.repeat(40));
