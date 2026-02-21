const db = require('../database/db');

// Get industries (same query as API)
const industries = db.prepare(`
  SELECT 
    COALESCE(industry, category, 'Other') as industry,
    COUNT(*) as jobCount,
    SUM(openings) as totalOpenings
  FROM jobs 
  WHERE status = 'active'
  AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))
  GROUP BY COALESCE(industry, category, 'Other')
  ORDER BY jobCount DESC
`).all();

console.log('\n📊 Industries from API:');
industries.forEach(ind => {
  console.log(`  - ${ind.industry}: ${ind.jobCount} jobs, ${ind.totalOpenings} openings`);
});

// Get sample jobs and their industry values
const sampleJobs = db.prepare(`
  SELECT id, title, industry, category, 
    COALESCE(industry, category, 'Other') as computedIndustry
  FROM jobs 
  WHERE status = 'active'
  AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))
  LIMIT 10
`).all();

console.log('\n📋 Sample Jobs and their Industry values:');
sampleJobs.forEach(job => {
  console.log(`  Job ${job.id}: "${job.title}"`);
  console.log(`    - industry field: "${job.industry || 'NULL'}"`);
  console.log(`    - category field: "${job.category || 'NULL'}"`);
  console.log(`    - Computed (COALESCE): "${job.computedIndustry}"`);
  console.log('');
});
