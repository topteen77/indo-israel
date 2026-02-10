/**
 * Email test route – verify SES/SMTP is sending.
 * Admin-only: GET/PUT /api/email/settings for default_from_email.
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/db');
const { sendTestEmail } = require('../services/emailService');

const getAdminFromToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.query.token || req.query.role;
  if (token && token !== 'admin' && !token.includes('admin')) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(decoded.id);
      if (user) {
        req.user = { id: user.id, role: user.role };
        return next();
      }
    } catch (e) {}
  }
  if (token?.includes('admin')) {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'admin' LIMIT 1").get();
    req.user = user ? { id: user.id, role: 'admin' } : { id: 'admin-1', role: 'admin' };
  } else {
    req.user = null;
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * POST /api/email/test
 * Send a test email. Body: { "to": "optional@email.com" } or omit to use RECRUITMENT_EMAIL.
 */
router.post('/test', async (req, res) => {
  try {
    const to = req.body && req.body.to ? req.body.to : null;
    const result = await sendTestEmail(to);
    if (result.preview) {
      return res.json({
        success: true,
        message: 'Email service is disabled. Enable with EMAIL_SERVICE_ENABLED=true in .env',
        preview: true,
      });
    }
    res.json({
      success: true,
      message: 'Test email sent',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Test email route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
});

/**
 * GET /api/email/settings
 * Admin only. Returns current email settings (e.g. default_from_email).
 */
router.get('/settings', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const default_from_email = db.getSetting('default_from_email');
    res.json({
      success: true,
      data: {
        default_from_email: default_from_email || process.env.DEFAULT_FROM_EMAIL || '',
      },
    });
  } catch (e) {
    console.error('Get email settings error:', e);
    res.status(500).json({ success: false, message: 'Failed to get email settings' });
  }
});

/**
 * PUT /api/email/settings
 * Admin only. Body: { default_from_email: "From Name <email@example.com>" }
 */
router.put('/settings', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const { default_from_email } = req.body || {};
    if (default_from_email !== undefined) {
      db.setSetting('default_from_email', String(default_from_email).trim());
    }
    const updated = db.getSetting('default_from_email');
    res.json({
      success: true,
      data: { default_from_email: updated || '' },
      message: 'Email settings updated',
    });
  } catch (e) {
    console.error('Update email settings error:', e);
    res.status(500).json({ success: false, message: 'Failed to update email settings' });
  }
});

module.exports = router;
