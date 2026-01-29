const express = require('express');
const router = express.Router();
const db = require('../database/db');
const {
  exportApplication,
  bulkExportApplications,
  syncAllApplications,
  autoRankApplications,
} = require('../services/googleSheetsService');

/**
 * POST /api/google-sheets/export
 * Export a single application to Google Sheets
 */
router.post('/export', async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required',
      });
    }

    // Get application from database
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Parse JSON fields
    const applicationData = {
      ...application,
      languages: application.languages ? JSON.parse(application.languages) : [],
      routing: application.routing ? JSON.parse(application.routing) : null,
      files: application.files ? JSON.parse(application.files) : null,
    };

    const result = await exportApplication(applicationData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export to Google Sheets',
      error: error.message,
    });
  }
});

/**
 * POST /api/google-sheets/bulk-export
 * Bulk export applications to Google Sheets
 */
router.post('/bulk-export', async (req, res) => {
  try {
    const { applicationIds } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Application IDs array is required',
      });
    }

    // Get applications from database
    const placeholders = applicationIds.map(() => '?').join(',');
    const applications = db
      .prepare(`SELECT * FROM applications WHERE id IN (${placeholders})`)
      .all(...applicationIds);

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No applications found',
      });
    }

    // Parse JSON fields
    const applicationsData = applications.map((app) => ({
      ...app,
      languages: app.languages ? JSON.parse(app.languages) : [],
      routing: app.routing ? JSON.parse(app.routing) : null,
      files: app.files ? JSON.parse(app.files) : null,
    }));

    const result = await bulkExportApplications(applicationsData);

    res.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('Error bulk exporting to Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk export to Google Sheets',
      error: error.message,
    });
  }
});

/**
 * POST /api/google-sheets/sync-all
 * Sync all applications to Google Sheets
 */
router.post('/sync-all', async (req, res) => {
  try {
    const result = await syncAllApplications(db);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync to Google Sheets',
      error: error.message,
    });
  }
});

/**
 * POST /api/google-sheets/rank
 * Manually trigger auto-ranking
 */
router.post('/rank', async (req, res) => {
  try {
    await autoRankApplications();
    res.json({
      success: true,
      message: 'Applications ranked successfully',
    });
  } catch (error) {
    console.error('Error ranking applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rank applications',
      error: error.message,
    });
  }
});

/**
 * GET /api/google-sheets/status
 * Get Google Sheets integration status
 */
router.get('/status', (req, res) => {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  res.json({
    success: true,
    data: {
      configured: !!(sheetsId && serviceAccountKey),
      sheetsId: sheetsId || null,
      serviceAccountKeyConfigured: !!serviceAccountKey,
    },
  });
});

module.exports = router;
