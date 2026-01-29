const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../database/db');
const { sendApplicationConfirmation } = require('../services/emailService');
const { sendApplicationConfirmationWhatsApp } = require('../services/whatsappService');
const { exportApplication } = require('../services/googleSheetsService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

// Helper function to parse application from database row
function parseApplication(row) {
  return {
    id: row.id,
    submissionId: row.submissionId,
    userId: row.userId,
    jobId: row.jobId,
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    maritalStatus: row.maritalStatus,
    mobileNumber: row.mobileNumber,
    email: row.email,
    permanentAddress: row.permanentAddress,
    hasPassport: row.hasPassport,
    passportNumber: row.passportNumber,
    passportIssuePlace: row.passportIssuePlace,
    passportIssueDate: row.passportIssueDate,
    passportExpiryDate: row.passportExpiryDate,
    jobCategory: row.jobCategory,
    specificTrade: row.specificTrade,
    experienceYears: row.experienceYears,
    workedAbroad: row.workedAbroad,
    countriesWorked: row.countriesWorked,
    hasCertificate: row.hasCertificate,
    certificateDetails: row.certificateDetails,
    canReadDrawings: row.canReadDrawings,
    languages: row.languages ? JSON.parse(row.languages) : [],
    medicalCondition: row.medicalCondition,
    medicalDetails: row.medicalDetails,
    criminalCase: row.criminalCase,
    criminalDetails: row.criminalDetails,
    declaration: row.declaration === 1,
    digitalSignature: row.digitalSignature,
    autoScore: row.autoScore,
    routing: row.routing ? JSON.parse(row.routing) : null,
    status: row.status,
    language: row.language,
    files: row.files ? JSON.parse(row.files) : {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// File upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      fileUrl: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message,
    });
  }
});

// Get all applications (for admin)
router.get('/all', (req, res) => {
  try {
    const { status, userId, jobId } = req.query;
    
    let query = 'SELECT * FROM applications WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }
    
    if (jobId) {
      query += ' AND jobId = ?';
      params.push(jobId);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const rows = db.prepare(query).all(...params);
    const applications = rows.map(parseApplication);
    
    res.json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
});

// Get application by ID
router.get('/israel-skilled-worker/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by submissionId first, then by id
    let row = db.prepare('SELECT * FROM applications WHERE submissionId = ?').get(id);
    if (!row) {
      row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const application = parseApplication(row);

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message,
    });
  }
});

// Submit new application
router.post('/israel-skilled-worker', (req, res) => {
  try {
    const applicationData = req.body;

    // Validate required fields
    const requiredFields = [
      'fullName',
      'dateOfBirth',
      'gender',
      'mobileNumber',
      'email',
      'hasPassport',
      'jobCategory',
      'experienceYears',
      'declaration',
      'digitalSignature',
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = applicationData[field];
      if (field === 'declaration') {
        return value === undefined || value === null || value === false;
      }
      if (field === 'digitalSignature') {
        return !value || (typeof value === 'string' && value.trim() === '');
      }
      // For radio buttons, empty string is invalid
      if (field === 'hasPassport' || field === 'gender') {
        return !value || (typeof value === 'string' && value.trim() === '');
      }
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      console.error('Application data received:', {
        fullName: applicationData.fullName,
        hasPassport: applicationData.hasPassport,
        gender: applicationData.gender,
        declaration: applicationData.declaration,
        digitalSignature: applicationData.digitalSignature ? 'present' : 'missing',
        jobCategory: applicationData.jobCategory,
        experienceYears: applicationData.experienceYears,
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields,
        receivedData: Object.keys(applicationData),
      });
    }

    // Generate submission ID
    const submissionId = applicationData.submissionId || `ISR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Insert application
    const insertApp = db.prepare(`
      INSERT INTO applications (
        submissionId, userId, jobId, fullName, dateOfBirth, gender, maritalStatus,
        mobileNumber, email, permanentAddress, hasPassport, passportNumber,
        passportIssuePlace, passportIssueDate, passportExpiryDate, jobCategory,
        specificTrade, experienceYears, workedAbroad, countriesWorked,
        hasCertificate, certificateDetails, canReadDrawings, languages,
        medicalCondition, medicalDetails, criminalCase, criminalDetails,
        declaration, digitalSignature, autoScore, routing, status, language, files
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertApp.run(
      submissionId,
      applicationData.userId || null,
      applicationData.jobId || null,
      applicationData.fullName,
      applicationData.dateOfBirth,
      applicationData.gender || null,
      applicationData.maritalStatus || null,
      applicationData.mobileNumber,
      applicationData.email,
      applicationData.permanentAddress || null,
      applicationData.hasPassport,
      applicationData.passportNumber || null,
      applicationData.passportIssuePlace || null,
      applicationData.passportIssueDate || null,
      applicationData.passportExpiryDate || null,
      applicationData.jobCategory,
      applicationData.specificTrade || null,
      applicationData.experienceYears,
      applicationData.workedAbroad || null,
      applicationData.countriesWorked || null,
      applicationData.hasCertificate || null,
      applicationData.certificateDetails || null,
      applicationData.canReadDrawings || null,
      applicationData.languages ? JSON.stringify(applicationData.languages) : null,
      applicationData.medicalCondition || null,
      applicationData.medicalDetails || null,
      applicationData.criminalCase || null,
      applicationData.criminalDetails || null,
      applicationData.declaration ? 1 : 0,
      applicationData.digitalSignature || null,
      applicationData.autoScore || 0,
      applicationData.routing ? JSON.stringify(applicationData.routing) : null,
      applicationData.status || 'submitted',
      applicationData.language || 'en',
      applicationData.files ? JSON.stringify(applicationData.files) : null
    );

    const newApplication = parseApplication(
      db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid)
    );

    // Send confirmation email (async, don't wait for it)
    sendApplicationConfirmation(newApplication).catch((error) => {
      console.error('Failed to send confirmation email:', error);
    });

    // Send confirmation WhatsApp (async, don't wait for it)
    sendApplicationConfirmationWhatsApp(newApplication).catch((error) => {
      console.error('Failed to send confirmation WhatsApp:', error);
    });

    // Export to Google Sheets (async, don't wait for it)
    if (process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      exportApplication(newApplication).catch((error) => {
        console.error('Failed to export to Google Sheets:', error);
      });
    }

    // Save application data to worker profile for pre-fill on next form load
    const userId = applicationData.userId || newApplication.userId;
    if (userId) {
      try {
        const profileData = {
          fullName: newApplication.fullName,
          email: newApplication.email,
          mobileNumber: newApplication.mobileNumber,
          permanentAddress: newApplication.permanentAddress,
          dateOfBirth: newApplication.dateOfBirth,
          gender: newApplication.gender,
          maritalStatus: newApplication.maritalStatus,
          hasPassport: newApplication.hasPassport,
          passportNumber: newApplication.passportNumber,
          passportIssuePlace: newApplication.passportIssuePlace,
          passportIssueDate: newApplication.passportIssueDate,
          passportExpiryDate: newApplication.passportExpiryDate,
          jobCategory: newApplication.jobCategory,
          specificTrade: newApplication.specificTrade,
          experienceYears: newApplication.experienceYears,
          workedAbroad: newApplication.workedAbroad,
          countriesWorked: newApplication.countriesWorked,
          hasCertificate: newApplication.hasCertificate,
          certificateDetails: newApplication.certificateDetails,
          canReadDrawings: newApplication.canReadDrawings,
          languages: newApplication.languages,
          medicalCondition: newApplication.medicalCondition,
          medicalDetails: newApplication.medicalDetails,
          criminalCase: newApplication.criminalCase,
          criminalDetails: newApplication.criminalDetails,
          files: newApplication.files,
        };
        const json = JSON.stringify(profileData);
        db.prepare(`
          INSERT INTO worker_profiles (userId, profileData, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(userId) DO UPDATE SET profileData = excluded.profileData, updatedAt = CURRENT_TIMESTAMP
        `).run(userId, json);
      } catch (profileErr) {
        console.error('Failed to save worker profile for pre-fill:', profileErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: newApplication,
      id: newApplication.id,
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message,
    });
  }
});

// Update application
router.put('/israel-skilled-worker/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Find application by submissionId or id
    let existingApp = db.prepare('SELECT * FROM applications WHERE submissionId = ?').get(id);
    if (!existingApp) {
      existingApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    }

    if (!existingApp) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const updateData = req.body;
    const appId = existingApp.id;

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    const fieldMap = {
      fullName: 'fullName',
      dateOfBirth: 'dateOfBirth',
      gender: 'gender',
      maritalStatus: 'maritalStatus',
      mobileNumber: 'mobileNumber',
      email: 'email',
      permanentAddress: 'permanentAddress',
      hasPassport: 'hasPassport',
      passportNumber: 'passportNumber',
      passportIssuePlace: 'passportIssuePlace',
      passportIssueDate: 'passportIssueDate',
      passportExpiryDate: 'passportExpiryDate',
      jobCategory: 'jobCategory',
      specificTrade: 'specificTrade',
      experienceYears: 'experienceYears',
      workedAbroad: 'workedAbroad',
      countriesWorked: 'countriesWorked',
      hasCertificate: 'hasCertificate',
      certificateDetails: 'certificateDetails',
      canReadDrawings: 'canReadDrawings',
      languages: 'languages',
      medicalCondition: 'medicalCondition',
      medicalDetails: 'medicalDetails',
      criminalCase: 'criminalCase',
      criminalDetails: 'criminalDetails',
      declaration: 'declaration',
      digitalSignature: 'digitalSignature',
      autoScore: 'autoScore',
      routing: 'routing',
      status: 'status',
      language: 'language',
      files: 'files',
    };

    Object.keys(fieldMap).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${fieldMap[key]} = ?`);
        if (key === 'languages' || key === 'routing' || key === 'files') {
          updateValues.push(JSON.stringify(updateData[key]));
        } else if (key === 'declaration') {
          updateValues.push(updateData[key] ? 1 : 0);
        } else {
          updateValues.push(updateData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(appId);

    const updateQuery = `UPDATE applications SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...updateValues);

    const updatedApp = parseApplication(
      db.prepare('SELECT * FROM applications WHERE id = ?').get(appId)
    );

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: updatedApp,
      id: updatedApp.id,
    });
  } catch (error) {
    console.error('Application update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message,
    });
  }
});

// Delete application
router.delete('/israel-skilled-worker/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Find application by submissionId or id
    let existingApp = db.prepare('SELECT id FROM applications WHERE submissionId = ?').get(id);
    if (!existingApp) {
      existingApp = db.prepare('SELECT id FROM applications WHERE id = ?').get(id);
    }

    if (!existingApp) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    db.prepare('DELETE FROM applications WHERE id = ?').run(existingApp.id);

    res.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message,
    });
  }
});

// Get applications by status
router.get('/status/:status', (req, res) => {
  try {
    const { status } = req.params;
    const rows = db.prepare('SELECT * FROM applications WHERE status = ? ORDER BY createdAt DESC').all(status);
    const applications = rows.map(parseApplication);

    res.json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
});

module.exports = router;
