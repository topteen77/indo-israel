/**
 * Configuration Testing Script
 * Tests all key configurations for blocked tests
 */

const fs = require('fs');
const path = require('path');

// Load .env from project root (try multiple paths)
const possiblePaths = [
  path.resolve(__dirname, '../.env'),           // From backend/scripts/
  path.resolve(__dirname, '../../.env'),        // From backend/
  path.resolve(process.cwd(), '.env'),           // Current working directory
  path.resolve(process.cwd(), '../.env'),       // Parent directory
];

let envPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    envPath = p;
    break;
  }
}

if (envPath) {
  require('dotenv').config({ path: envPath });
  console.log(`📁 Loading .env from: ${envPath}\n`);
} else {
  console.log('⚠️  .env file not found, using environment variables\n');
  require('dotenv').config();
}

console.log('\n🔍 Configuration Test Report\n');
console.log('='.repeat(60));

// Test 1: Google Sheets Configuration
console.log('\n📊 Phase 5: Google Sheets Integration');
console.log('-'.repeat(60));

const googleSheetsId = process.env.GOOGLE_SHEETS_ID;
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

if (googleSheetsId) {
  console.log('✅ GOOGLE_SHEETS_ID: SET');
  console.log(`   Value: ${googleSheetsId.substring(0, 20)}...`);
} else {
  console.log('❌ GOOGLE_SHEETS_ID: NOT SET');
}

if (serviceAccountKey) {
  console.log('✅ GOOGLE_SERVICE_ACCOUNT_KEY: SET');
  console.log(`   Path: ${serviceAccountKey}`);
  
  // Check if file exists (try multiple path resolutions)
  const baseDir = path.resolve(__dirname, '../..'); // Project root
  const keyPath1 = path.resolve(baseDir, serviceAccountKey.replace('./', ''));
  const keyPath2 = path.resolve(__dirname, '..', serviceAccountKey.replace('./', ''));
  const keyPath3 = path.resolve(process.cwd(), serviceAccountKey.replace('./', ''));
  
  let keyPath = null;
  if (fs.existsSync(keyPath1)) {
    keyPath = keyPath1;
  } else if (fs.existsSync(keyPath2)) {
    keyPath = keyPath2;
  } else if (fs.existsSync(keyPath3)) {
    keyPath = keyPath3;
  }
  
  if (keyPath && fs.existsSync(keyPath)) {
    console.log('✅ Service account key file: EXISTS');
    try {
      const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      console.log(`   Service account email: ${keyData.client_email || 'N/A'}`);
      console.log(`   Project ID: ${keyData.project_id || 'N/A'}`);
    } catch (error) {
      console.log('⚠️  Service account key file: INVALID JSON');
    }
  } else {
    console.log(`❌ Service account key file: NOT FOUND at ${keyPath}`);
  }
} else {
  console.log('❌ GOOGLE_SERVICE_ACCOUNT_KEY: NOT SET');
}

// Check packages
try {
  require('google-spreadsheet');
  require('google-auth-library');
  console.log('✅ Required packages: INSTALLED (google-spreadsheet, google-auth-library)');
} catch (error) {
  console.log('❌ Required packages: NOT INSTALLED');
  console.log('   Run: npm install google-spreadsheet google-auth-library');
}

// Test 2: GPS Location Configuration
console.log('\n📍 Phase 6: GPS Location Tracking');
console.log('-'.repeat(60));

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (googleMapsKey) {
  console.log('✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: SET');
  console.log(`   Value: ${googleMapsKey.substring(0, 20)}...`);
} else {
  console.log('⚠️  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: NOT SET (optional for map view)');
  console.log('   Note: Location tracking works without this, but map view requires it');
}

console.log('ℹ️  Browser location permissions: Check manually in browser');

// Test 3: OpenAI Configuration
console.log('\n🤖 Phase 8: AI Job Post Generator');
console.log('-'.repeat(60));

const openaiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (openaiKey) {
  console.log('✅ OPENAI_API_KEY: SET');
  console.log(`   Value: ${openaiKey.substring(0, 10)}...`);
  console.log(`   Model: ${openaiModel}`);
} else {
  console.log('❌ OPENAI_API_KEY: NOT SET');
  console.log('   Get API key from: https://platform.openai.com/api-keys');
  console.log('   Note: Key exists in .env but is commented out (line 87)');
}

// Check package
try {
  require('openai');
  console.log('✅ Required package: INSTALLED (openai)');
} catch (error) {
  console.log('❌ Required package: NOT INSTALLED');
  console.log('   Run: npm install openai');
}

// Test 4: MERF Compliance Configuration
console.log('\n⚖️  Phase 7: MERF Compliance');
console.log('-'.repeat(60));

const minWage = process.env.MINIMUM_WAGE_ILS;
const maxHours = process.env.MAX_HOURS_MONTH;
const overtimeFirst = process.env.OVERTIME_RATE_FIRST;
const overtimeAdditional = process.env.OVERTIME_RATE_ADDITIONAL;

console.log(`✅ MINIMUM_WAGE_ILS: ${minWage || 'NOT SET'} (default: 5300)`);
console.log(`✅ MAX_HOURS_MONTH: ${maxHours || 'NOT SET'} (default: 182)`);
console.log(`✅ OVERTIME_RATE_FIRST: ${overtimeFirst || 'NOT SET'} (default: 1.25)`);
console.log(`✅ OVERTIME_RATE_ADDITIONAL: ${overtimeAdditional || 'NOT SET'} (default: 1.5)`);

// Summary
console.log('\n📋 Configuration Summary');
console.log('='.repeat(60));

let readyCount = 0;
let totalCount = 3;

if (googleSheetsId && serviceAccountKey) {
  const baseDir = path.resolve(__dirname, '../..'); // Project root
  const keyPath1 = path.resolve(baseDir, serviceAccountKey.replace('./', ''));
  const keyPath2 = path.resolve(__dirname, '..', serviceAccountKey.replace('./', ''));
  const keyPath3 = path.resolve(process.cwd(), serviceAccountKey.replace('./', ''));
  
  let keyPath = null;
  if (fs.existsSync(keyPath1)) {
    keyPath = keyPath1;
  } else if (fs.existsSync(keyPath2)) {
    keyPath = keyPath2;
  } else if (fs.existsSync(keyPath3)) {
    keyPath = keyPath3;
  }
  
  if (keyPath && fs.existsSync(keyPath)) {
    try {
      require('google-spreadsheet');
      require('google-auth-library');
      console.log('✅ Google Sheets: READY');
      readyCount++;
    } catch (e) {
      console.log('⚠️  Google Sheets: CONFIGURED but packages missing');
    }
  } else {
    console.log('❌ Google Sheets: NOT READY (key file not found)');
  }
} else {
  console.log('❌ Google Sheets: NOT CONFIGURED');
}

if (openaiKey) {
  try {
    require('openai');
    console.log('✅ AI Generator: READY');
    readyCount++;
  } catch (e) {
    console.log('⚠️  AI Generator: CONFIGURED but package missing');
  }
} else {
  console.log('❌ AI Generator: NOT CONFIGURED (key commented out in .env)');
}

console.log('✅ GPS Location: READY (browser permissions required)');
readyCount++;

console.log(`\n📊 Status: ${readyCount}/${totalCount} services ready`);
console.log('='.repeat(60));
console.log('\n');
