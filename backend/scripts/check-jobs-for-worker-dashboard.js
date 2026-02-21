const db = require('../database/db');

console.log('\n🔍 Checking Jobs for Worker Dashboard...\n');

// Check total jobs
const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
console.log(`📊 Total jobs in database: ${totalJobs.count}`);

// Check active jobs
const activeJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'").get();
console.log(`✅ Active jobs: ${activeJobs.count}`);

// Check Excel jobs (with vacancyCode or postedDate)
const excelJobs = db.prepare(`
  SELECT COUNT(*) as count 
  FROM jobs 
  WHERE status = 'active'
  AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))
`).get();
console.log(`📋 Excel jobs (with vacancyCode or postedDate): ${excelJobs.count}`);

// Show sample jobs
const sampleJobs = db.prepare(`
  SELECT id, title, company, status, vacancyCode, postedDate
  FROM jobs 
  WHERE status = 'active'
  AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))
  LIMIT 5
`).all();

console.log('\n📝 Sample Excel Jobs:');
sampleJobs.forEach((job, index) => {
  console.log(`  ${index + 1}. ID: ${job.id} - "${job.title}"`);
  console.log(`     Company: ${job.company}`);
  console.log(`     VacancyCode: ${job.vacancyCode || 'N/A'}`);
  console.log(`     PostedDate: ${job.postedDate || 'N/A'}`);
  console.log('');
});

// Check jobs without Excel fields
const nonExcelJobs = db.prepare(`
  SELECT COUNT(*) as count 
  FROM jobs 
  WHERE status = 'active'
  AND (vacancyCode IS NULL OR vacancyCode = '')
  AND (postedDate IS NULL OR postedDate = '')
`).get();
console.log(`⚠️  Active jobs WITHOUT Excel fields (will NOT show): ${nonExcelJobs.count}`);

if (nonExcelJobs.count > 0) {
  console.log('\n⚠️  WARNING: There are active jobs without Excel fields that will not be displayed!');
  const sampleNonExcel = db.prepare(`
    SELECT id, title, company
    FROM jobs 
    WHERE status = 'active'
    AND (vacancyCode IS NULL OR vacancyCode = '')
    AND (postedDate IS NULL OR postedDate = '')
    LIMIT 3
  `).all();
  console.log('   Sample non-Excel jobs:');
  sampleNonExcel.forEach(job => {
    console.log(`     - ID: ${job.id} - "${job.title}"`);
  });
}

console.log('\n✅ Check complete!\n');
