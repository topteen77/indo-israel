const XLSX = require('xlsx');
const path = require('path');
const db = require('../database/db');

// Path to the Excel file - using Book1.xlsx
const excelFilePath = path.join(__dirname, '../../Book1.xlsx');

/**
 * Read Excel file and import jobs from Sheet1
 */
function importJobsFromExcel() {
  try {
    console.log('📖 Reading Excel file:', excelFilePath);
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    // Get the first sheet (Sheet1)
    const sheetName = workbook.SheetNames[0] || 'Sheet1';
    if (!workbook.SheetNames.includes(sheetName)) {
      console.error(`❌ Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
      return;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ Found ${data.length} rows in ${sheetName}`);
    
    if (data.length === 0) {
      console.log(`⚠️ No data found in ${sheetName}`);
      return;
    }
    
    // Log first row to see structure
    console.log('📋 Sample row structure:', JSON.stringify(data[0], null, 2));
    
    // Delete all existing jobs (and related applications)
    console.log('🗑️ Deleting old jobs and related data...');
    
    // Disable foreign keys temporarily
    db.pragma('foreign_keys = OFF');
    
    // Delete applications first
    const deleteApps = db.prepare('DELETE FROM applications').run();
    console.log(`   - Deleted ${deleteApps.changes} applications`);
    
    // Delete jobs
    const deleteResult = db.prepare('DELETE FROM jobs').run();
    console.log(`   - Deleted ${deleteResult.changes} jobs`);
    
    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');
    console.log(`✅ Cleaned up old data`);
    
    // Prepare insert statement with all fields
    const insertJob = db.prepare(`
      INSERT INTO jobs (
        title, company, location, salary, experience, type, 
        description, requirements, category, industry, openings, status, postedBy,
        vacancyCode, postedDate, contractLength, qualification, roleResponsibilities
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let importedCount = 0;
    let skippedCount = 0;
    
    // Process each row
    for (const row of data) {
      try {
        // Map Excel columns to job fields - using all columns from Book1.xlsx
        const title = row['Job Title'] || '';
        const company = 'Dynamic Staffing Services';
        const location = row['Country'] || 'Israel';
        const salary = 'As per contract'; // Not in Excel, using default
        const experience = row['Experience'] || 'Not specified';
        const type = row['Job Type'] || 'Full-time';
        const description = row['Job Description'] || '';
        const industry = row['Industry'] || 'General';
        const category = industry; // Use industry as category
        const openings = parseInt(row['Total Vacancies'] || '1', 10) || 1;
        
        // New fields from Excel
        const vacancyCode = row['Vacancy Code'] || '';
        const postedDate = row['Posted Date'] || '';
        const contractLength = row['Contract Length'] || '';
        const qualification = row['Qualification'] || '';
        const roleResponsibilities = row['Role & Responsibilities'] || '';
        
        // Handle requirements - combine Qualification and Role & Responsibilities
        let requirements = [];
        if (qualification) {
          requirements.push(`Qualification: ${qualification}`);
        }
        if (roleResponsibilities) {
          requirements.push(`Role & Responsibilities: ${roleResponsibilities}`);
        }
        if (contractLength) {
          requirements.push(`Contract Length: ${contractLength}`);
        }
        
        // Skip if essential fields are missing
        if (!title || !company || !location) {
          console.log(`⚠️ Skipping row - missing essential fields:`, row);
          skippedCount++;
          continue;
        }
        
        // Insert job with all fields
        insertJob.run(
          title,
          company,
          location,
          salary,
          experience,
          type,
          description,
          JSON.stringify(requirements),
          category,
          industry,
          openings,
          'active',
          null, // postedBy
          vacancyCode,
          postedDate,
          contractLength,
          qualification,
          roleResponsibilities
        );
        
        importedCount++;
      } catch (error) {
        console.error('❌ Error processing row:', error.message, row);
        skippedCount++;
      }
    }
    
    console.log(`\n✅ Import completed!`);
    console.log(`   - Imported: ${importedCount} jobs`);
    console.log(`   - Skipped: ${skippedCount} rows`);
    
  } catch (error) {
    console.error('❌ Error importing jobs:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  importJobsFromExcel();
}

module.exports = { importJobsFromExcel };
