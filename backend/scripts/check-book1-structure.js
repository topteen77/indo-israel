const XLSX = require('xlsx');
const path = require('path');

// Path to the Excel file
const excelFilePath = path.join(__dirname, '../../Book1.xlsx');

try {
  console.log('📖 Reading Excel file:', excelFilePath);
  
  // Read the Excel file
  const workbook = XLSX.readFile(excelFilePath);
  
  console.log('📋 Available sheets:', workbook.SheetNames);
  
  // Get the first sheet (or you can specify a name)
  const sheetName = workbook.SheetNames[0];
  console.log(`\n📄 Using sheet: "${sheetName}"`);
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`\n✅ Found ${data.length} rows`);
  
  if (data.length > 0) {
    console.log('\n📋 Sample row structure:');
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log('\n📊 Column names found:');
    console.log(Object.keys(data[0]).join(', '));
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}
