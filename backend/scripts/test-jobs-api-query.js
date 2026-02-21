const db = require('../database/db');

console.log('\n🧪 Testing Jobs API Query...\n');

// Test the exact query used in the API
const status = 'active';
const query = "SELECT * FROM jobs WHERE status = ? AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != '')) ORDER BY createdAt DESC";
const params = [status];

try {
  const jobs = db.prepare(query).all(...params);
  console.log(`✅ Query successful! Found ${jobs.length} jobs\n`);
  
  if (jobs.length > 0) {
    console.log('📋 First 3 jobs:');
    jobs.slice(0, 3).forEach((job, index) => {
      console.log(`  ${index + 1}. ID: ${job.id} - "${job.title}"`);
      console.log(`     Status: ${job.status}`);
      console.log(`     VacancyCode: ${job.vacancyCode || 'N/A'}`);
      console.log(`     PostedDate: ${job.postedDate || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No jobs found! This might be the issue.');
  }
} catch (error) {
  console.error('❌ Query failed:', error.message);
  console.error('Full error:', error);
}

console.log('\n✅ Test complete!\n');
