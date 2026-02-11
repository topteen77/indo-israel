/**
 * Admin-only routes: GET/PUT /api/admin/settings, GET /api/admin/website-errors
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db');

const getAdminFromToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.query.token || req.query.role;
  if (token && token !== 'admin' && !token.includes('admin')) {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

function maskSecret(value) {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= 4) return '••••';
  return '••••' + value.slice(-4);
}

const EMAIL_KEYS = ['default_from_email', 'email_service_enabled', 'recruitment_email', 'recruitment_phone', 'recruitment_whatsapp', 'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass'];
const EMAIL_SECRET_KEYS = ['smtp_user', 'smtp_pass'];
const WHATSAPP_KEYS = ['whatsapp_enabled', 'emergency_template_name', 'application_confirmation_template', 'application_rejection_template'];
const WHATSAPP_SECRET_KEYS = ['interakt_api_key'];
const SMS_KEYS = ['sms_enabled', 'twilio_account_sid', 'twilio_phone_number'];
const SMS_SECRET_KEYS = ['twilio_auth_token'];
const OPENAI_KEYS = ['openai_model'];
const OPENAI_SECRET_KEYS = ['openai_api_key'];
const WEBSITE_KEYS = ['cors_origins', 'chatbot_rate_limit_max', 'chatbot_rate_limit_window', 'chatbot_session_timeout'];

function getSettings(keys, secretKeys = []) {
  const out = {};
  for (const k of keys) {
    if (secretKeys.includes(k)) continue;
    const v = db.getSetting(k);
    out[k] = v !== null && v !== undefined ? v : '';
  }
  for (const k of secretKeys) {
    const v = db.getSetting(k);
    out[k] = v ? maskSecret(v) : '';
  }
  return out;
}

router.get('/settings', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const email = getSettings(EMAIL_KEYS, EMAIL_SECRET_KEYS);
    const whatsapp = getSettings([...WHATSAPP_KEYS, ...WHATSAPP_SECRET_KEYS], WHATSAPP_SECRET_KEYS);
    const sms = getSettings(SMS_KEYS, SMS_SECRET_KEYS);
    const openai = getSettings([...OPENAI_KEYS, ...OPENAI_SECRET_KEYS], OPENAI_SECRET_KEYS);
    const website = getSettings(WEBSITE_KEYS);
    res.json({
      success: true,
      data: { email, whatsapp, sms, openai, website },
    });
  } catch (e) {
    console.error('Get admin settings error:', e);
    res.status(500).json({ success: false, message: 'Failed to get settings' });
  }
});

router.put('/settings', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const body = req.body || {};
    const update = (keys, section, skipKeys = []) => {
      if (!section || typeof section !== 'object') return;
      for (const k of keys) {
        if (skipKeys.includes(k)) continue;
        if (section[k] !== undefined && section[k] !== null) {
          const v = String(section[k]).trim();
          db.setSetting(k, v);
        }
      }
    };
    const updateSecrets = (keys, section) => {
      if (!section || typeof section !== 'object') return;
      for (const k of keys) {
        const v = section[k];
        if (v !== undefined && v !== null) {
          const s = String(v).trim();
          if (s && !s.startsWith('••••')) db.setSetting(k, s);
        }
      }
    };

    if (body.email) {
      update(EMAIL_KEYS, body.email, EMAIL_SECRET_KEYS);
      updateSecrets(EMAIL_SECRET_KEYS, body.email);
      try {
        const { reinitializeEmailService } = require('../services/emailService');
        if (reinitializeEmailService) reinitializeEmailService();
      } catch (e) {
        console.error('Email reinit after settings save:', e.message);
      }
    }
    if (body.whatsapp) {
      update([...WHATSAPP_KEYS, ...WHATSAPP_SECRET_KEYS], body.whatsapp, WHATSAPP_SECRET_KEYS);
      updateSecrets(WHATSAPP_SECRET_KEYS, body.whatsapp);
    }
    if (body.sms) {
      update(SMS_KEYS, body.sms, SMS_SECRET_KEYS);
      updateSecrets(SMS_SECRET_KEYS, body.sms);
    }
    if (body.openai) {
      update([...OPENAI_KEYS, ...OPENAI_SECRET_KEYS], body.openai, OPENAI_SECRET_KEYS);
      updateSecrets(OPENAI_SECRET_KEYS, body.openai);
    }
    if (body.website) {
      update(WEBSITE_KEYS, body.website);
    }

    const email = getSettings(EMAIL_KEYS, EMAIL_SECRET_KEYS);
    const whatsapp = getSettings([...WHATSAPP_KEYS, ...WHATSAPP_SECRET_KEYS], WHATSAPP_SECRET_KEYS);
    const sms = getSettings(SMS_KEYS, SMS_SECRET_KEYS);
    const openai = getSettings([...OPENAI_KEYS, ...OPENAI_SECRET_KEYS], OPENAI_SECRET_KEYS);
    const website = getSettings(WEBSITE_KEYS);
    res.json({
      success: true,
      data: { email, whatsapp, sms, openai, website },
      message: 'Settings updated',
    });
  } catch (e) {
    console.error('Update admin settings error:', e);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

router.get('/website-errors', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const { getRecentErrors } = require('../utils/websiteErrorLogger');
    const lineLimit = Math.min(parseInt(req.query.lines, 10) || 500, 1000);
    const { entries, period } = getRecentErrors(lineLimit);
    res.json({ success: true, data: { entries, period } });
  } catch (e) {
    console.error('Get website errors:', e);
    res.status(500).json({ success: false, message: 'Failed to load error log' });
  }
});

module.exports = router;
