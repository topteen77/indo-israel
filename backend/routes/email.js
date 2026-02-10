/**
 * Email test route – verify SES/SMTP is sending.
 */
const express = require('express');
const router = express.Router();
const { sendTestEmail } = require('../services/emailService');

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

module.exports = router;
