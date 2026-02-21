const db = require('../database/db');

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

console.log('\n📊 Industries from Excel Jobs:');
console.log('────────────────────────────────────────');
console.log(JSON.stringify(industries, null, 2));
console.log(`\n✅ Total industries: ${industries.length}`);
