// Google Sheets integration
// Requires: npm install google-spreadsheet google-auth-library
let GoogleSpreadsheet, JWT;

try {
  const googleSpreadsheet = require('google-spreadsheet');
  const googleAuth = require('google-auth-library');
  GoogleSpreadsheet = googleSpreadsheet.GoogleSpreadsheet;
  JWT = googleAuth.JWT;
} catch (error) {
  console.log('⚠️ Google Sheets packages not installed. Run: npm install google-spreadsheet google-auth-library');
  GoogleSpreadsheet = null;
  JWT = null;
}
const fs = require('fs');
const path = require('path');

let doc = null;
let serviceAccountKey = null;

/**
 * Initialize Google Sheets service
 */
const initializeGoogleSheets = () => {
  if (!GoogleSpreadsheet || !JWT) {
    console.log('⚠️ Google Sheets packages not installed. Run: npm install google-spreadsheet google-auth-library');
    return false;
  }

  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!sheetsId) {
    console.log('⚠️ Google Sheets ID not configured. Set GOOGLE_SHEETS_ID in .env');
    return false;
  }

  if (!serviceAccountPath) {
    console.log('⚠️ Google Service Account Key not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY in .env');
    return false;
  }

  try {
    // Load service account key (resolve relative to project root)
    let keyPath;
    if (path.isAbsolute(serviceAccountPath)) {
      keyPath = serviceAccountPath;
    } else {
      // Try resolving from project root (parent of backend directory)
      const projectRoot = path.resolve(__dirname, '..');
      keyPath = path.resolve(projectRoot, serviceAccountPath.replace('./', ''));
      
      // Fallback: try from backend directory
      if (!fs.existsSync(keyPath)) {
        keyPath = path.resolve(__dirname, serviceAccountPath.replace('./', ''));
      }
    }
    
    if (!fs.existsSync(keyPath)) {
      console.error(`❌ Service account key file not found: ${keyPath}`);
      console.error(`   Tried path: ${serviceAccountPath}`);
      return false;
    }

    serviceAccountKey = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    // Initialize Google Spreadsheet
    doc = new GoogleSpreadsheet(sheetsId);

    console.log('✅ Google Sheets service initialized');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Google Sheets:', error.message);
    return false;
  }
};

/**
 * Authenticate with Google Sheets API
 */
const authenticate = async () => {
  if (!doc || !serviceAccountKey) {
    throw new Error('Google Sheets not initialized');
  }

  try {
    const jwt = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await doc.useServiceAccountAuth(jwt);
    await doc.loadInfo();
    return true;
  } catch (error) {
    console.error('❌ Google Sheets authentication error:', error.message);
    throw error;
  }
};

/**
 * Get or create worksheet by title
 */
const getOrCreateWorksheet = async (title) => {
  await authenticate();

  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    sheet = await doc.addSheet({ title });
    console.log(`✅ Created new worksheet: ${title}`);
  }

  return sheet;
};

/**
 * Export application to Google Sheets
 */
const exportApplication = async (applicationData) => {
  if (!doc) {
    console.log('📊 Google Sheets not configured. Application data:', {
      id: applicationData.id,
      name: applicationData.fullName,
      score: applicationData.autoScore,
    });
    return { success: false, message: 'Google Sheets not configured' };
  }

  try {
    await authenticate();
    const sheet = await getOrCreateWorksheet('Applications');

    // Get headers if sheet is empty
    let headers = [];
    const rows = await sheet.getRows();
    
    if (rows.length === 0) {
      // Set headers
      headers = [
        'Application ID',
        'Submission ID',
        'Full Name',
        'Email',
        'Mobile Number',
        'Date of Birth',
        'Gender',
        'Job Category',
        'Specific Trade',
        'Experience Years',
        'Worked Abroad',
        'Countries Worked',
        'Has Certificate',
        'Can Read Drawings',
        'Languages',
        'Auto Score',
        'Status',
        'Routing',
        'Submitted Date',
        'Updated Date',
      ];
      await sheet.setHeaderRow(headers);
    } else {
      headers = sheet.headerValues;
    }

    // Prepare row data
    const rowData = {
      'Application ID': applicationData.id || '',
      'Submission ID': applicationData.submissionId || '',
      'Full Name': applicationData.fullName || '',
      'Email': applicationData.email || '',
      'Mobile Number': applicationData.mobileNumber || '',
      'Date of Birth': applicationData.dateOfBirth || '',
      'Gender': applicationData.gender || '',
      'Job Category': applicationData.jobCategory || '',
      'Specific Trade': applicationData.specificTrade || '',
      'Experience Years': applicationData.experienceYears || '',
      'Worked Abroad': applicationData.workedAbroad || '',
      'Countries Worked': applicationData.countriesWorked || '',
      'Has Certificate': applicationData.hasCertificate || '',
      'Can Read Drawings': applicationData.canReadDrawings || '',
      'Languages': Array.isArray(applicationData.languages) 
        ? applicationData.languages.join(', ') 
        : applicationData.languages || '',
      'Auto Score': applicationData.autoScore || 0,
      'Status': applicationData.status || 'submitted',
      'Routing': applicationData.routing 
        ? JSON.stringify(applicationData.routing) 
        : '',
      'Submitted Date': applicationData.createdAt || new Date().toISOString(),
      'Updated Date': applicationData.updatedAt || new Date().toISOString(),
    };

    // Check if application already exists
    const existingRow = rows.find(
      (row) => row.get('Application ID') === String(applicationData.id) ||
               row.get('Submission ID') === String(applicationData.submissionId)
    );

    if (existingRow) {
      // Update existing row
      Object.keys(rowData).forEach((key) => {
        if (headers.includes(key)) {
          existingRow.set(key, rowData[key]);
        }
      });
      await existingRow.save();
      console.log(`✅ Updated application ${applicationData.id} in Google Sheets`);
    } else {
      // Add new row
      await sheet.addRow(rowData);
      console.log(`✅ Exported application ${applicationData.id} to Google Sheets`);
    }

    // Auto-rank applications
    await autoRankApplications(sheet);

    return {
      success: true,
      message: 'Application exported to Google Sheets successfully',
    };
  } catch (error) {
    console.error('❌ Error exporting to Google Sheets:', error.message);
    return {
      success: false,
      message: 'Failed to export to Google Sheets',
      error: error.message,
    };
  }
};

/**
 * Auto-rank applications by score
 */
const autoRankApplications = async (sheet) => {
  try {
    await authenticate();
    
    if (!sheet) {
      sheet = await getOrCreateWorksheet('Applications');
    }

    const rows = await sheet.getRows();
    
    if (rows.length === 0) {
      return;
    }

    // Check if Rank column exists
    const headers = sheet.headerValues;
    const hasRankColumn = headers.includes('Rank');

    if (!hasRankColumn) {
      // Add Rank column
      await sheet.setHeaderRow([...headers, 'Rank']);
    }

    // Sort rows by Auto Score (descending)
    rows.sort((a, b) => {
      const scoreA = parseInt(a.get('Auto Score') || 0);
      const scoreB = parseInt(b.get('Auto Score') || 0);
      return scoreB - scoreA;
    });

    // Assign ranks
    let currentRank = 1;
    let previousScore = null;
    let rankCount = 0;

    for (const row of rows) {
      const score = parseInt(row.get('Auto Score') || 0);
      
      if (previousScore !== null && score < previousScore) {
        currentRank = rankCount + 1;
      }

      row.set('Rank', currentRank);
      await row.save();

      previousScore = score;
      rankCount++;
    }

    console.log(`✅ Auto-ranked ${rows.length} applications in Google Sheets`);
  } catch (error) {
    console.error('❌ Error auto-ranking applications:', error.message);
    throw error;
  }
};

/**
 * Bulk export applications
 */
const bulkExportApplications = async (applications) => {
  if (!doc) {
    console.log('📊 Google Sheets not configured. Skipping bulk export.');
    return { success: false, message: 'Google Sheets not configured' };
  }

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const application of applications) {
      const result = await exportApplication(application);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    return {
      success: true,
      message: `Exported ${successCount} applications, ${errorCount} errors`,
      data: {
        successCount,
        errorCount,
        total: applications.length,
      },
    };
  } catch (error) {
    console.error('❌ Error in bulk export:', error.message);
    return {
      success: false,
      message: 'Bulk export failed',
      error: error.message,
    };
  }
};

/**
 * Sync all applications from database to Google Sheets
 */
const syncAllApplications = async (db) => {
  if (!doc) {
    console.log('📊 Google Sheets not configured. Skipping sync.');
    return { success: false, message: 'Google Sheets not configured' };
  }

  try {
    const applications = db.prepare('SELECT * FROM applications ORDER BY createdAt DESC').all();
    
    if (applications.length === 0) {
      return {
        success: true,
        message: 'No applications to sync',
        data: { synced: 0 },
      };
    }

    const result = await bulkExportApplications(applications);

    return {
      success: true,
      message: `Synced ${result.data.successCount} applications to Google Sheets`,
      data: result.data,
    };
  } catch (error) {
    console.error('❌ Error syncing applications:', error.message);
    return {
      success: false,
      message: 'Sync failed',
      error: error.message,
    };
  }
};

// Initialize on module load if enabled
if (process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  initializeGoogleSheets();
}

module.exports = {
  initializeGoogleSheets,
  exportApplication,
  bulkExportApplications,
  syncAllApplications,
  autoRankApplications,
};
