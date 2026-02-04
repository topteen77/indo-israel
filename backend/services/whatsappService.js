/**
 * WhatsApp Service using Interakt API
 * Sends real WhatsApp messages via Interakt API
 */

const https = require('https');
let db;
try {
  db = require('../database/db');
} catch (e) {
  db = null;
}

// Interakt API Configuration (only channel used for WhatsApp)
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY;
const INTERAKT_API_URL = 'https://api.interakt.ai/v1/public/message/';
const WHATSAPP_DEBUG = process.env.WHATSAPP_DEBUG === 'true';
const EMERGENCY_TEMPLATE_NAME = process.env.EMERGENCY_TEMPLATE_NAME;
const APPLICATION_CONFIRMATION_TEMPLATE = process.env.INTERAKT_APPLICATION_CONFIRMATION_TEMPLATE || 'application_confirmation';
const APPLICATION_REJECTION_TEMPLATE = process.env.INTERAKT_APPLICATION_REJECTION_TEMPLATE || 'application_rejection';

function interaktOnlyError(phoneNumber, reason) {
  return {
    success: false,
    message: reason || 'WhatsApp message could not be sent via Interakt API',
    phoneNumber: phoneNumber || null,
  };
}

/** Mask phone for logs: show last 4 digits only (e.g. ***7890) */
function maskPhone(phoneNumber) {
  if (!phoneNumber) return '***';
  const s = String(phoneNumber).replace(/\D/g, '');
  if (s.length <= 4) return '****';
  return '***' + s.slice(-4);
}

// Ensure whatsapp_log table exists (in case DB was created before this table was added)
let _whatsappLogTableEnsured = false;
function ensureWhatsAppLogTable() {
  if (!db || _whatsappLogTableEnsured) return;
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS whatsapp_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        phoneMasked TEXT NOT NULL,
        success INTEGER NOT NULL,
        messageId TEXT,
        errorDetail TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    _whatsappLogTableEnsured = true;
  } catch (e) {
    console.error('WhatsApp log: could not ensure table:', e.message);
  }
}

/**
 * Track every WhatsApp send outcome: console log + persist to DB for admin dashboard.
 * View in production: docker compose logs backend | grep WHATSAPP_TRACK
 */
function trackWhatsAppSend(type, phoneNumber, result) {
  const ts = new Date().toISOString();
  const to = maskPhone(phoneNumber);
  const success = result && result.success;
  const messageId = result && result.messageId ? result.messageId : '';
  const error = result && !result.success && result.message ? String(result.message).substring(0, 500) : '';
  const line = `[WHATSAPP_TRACK] ${ts} type=${type} to=${to} success=${success}${messageId ? ' messageId=' + messageId : ''}${error ? ' error=' + error.replace(/\s+/g, ' ').substring(0, 100) : ''}`;
  console.log(line);

  if (!db) {
    console.warn('[WHATSAPP_TRACK] DB not available, log not persisted to dashboard');
    return;
  }
  try {
    ensureWhatsAppLogTable();
    db.prepare(
      `INSERT INTO whatsapp_log (type, phoneMasked, success, messageId, errorDetail) VALUES (?, ?, ?, ?, ?)`
    ).run(type, to, success ? 1 : 0, messageId || null, error || null);
  } catch (e) {
    console.error('Failed to persist WhatsApp log:', e.message);
  }
}

/**
 * Format phone number for WhatsApp (extract country code and phone number)
 */
const formatPhoneNumber = (phoneNumber) => {
  let cleanPhoneNumber = phoneNumber.replace(/\s+/g, ''); // Remove spaces
  let countryCode = '';
  
  // If phone starts with +, extract country code
  if (cleanPhoneNumber.startsWith('+')) {
    // For Indian numbers: +91XXXXXXXXXX
    if (cleanPhoneNumber.startsWith('+91')) {
      countryCode = '+91';
      cleanPhoneNumber = cleanPhoneNumber.substring(3);
    } else {
      // For other countries, extract first 1-3 digits after +
      const match = cleanPhoneNumber.match(/^\+(\d{1,3})(.+)$/);
      if (match) {
        countryCode = '+' + match[1];
        cleanPhoneNumber = match[2];
      }
    }
  } else if (cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length === 12) {
    // Indian number without +: 91XXXXXXXXXX
    countryCode = '+91';
    cleanPhoneNumber = cleanPhoneNumber.substring(2);
  } else if (cleanPhoneNumber.length === 10) {
    // 10 digit number, assume India
    countryCode = '+91';
  } else {
    // Default to India if no country code
    countryCode = '+91';
  }
  
  // Remove leading 0 if present
  if (cleanPhoneNumber.startsWith('0')) {
    cleanPhoneNumber = cleanPhoneNumber.substring(1);
  }
  
  return { countryCode, phoneNumber: cleanPhoneNumber };
};

/**
 * Send WhatsApp message via Interakt API only (no direct wa.me link).
 * Requires INTERAKT_API_KEY and a template name in .env.
 */
const sendWhatsAppViaInterakt = async (phoneNumber, message, options = {}) => {
  const { countryCode, phoneNumber: cleanPhone } = formatPhoneNumber(phoneNumber);
  
  const trackType = options.trackType || options.type || 'unknown';

  if (!INTERAKT_API_KEY) {
    console.error('❌ Interakt API key not configured. Set INTERAKT_API_KEY in .env');
    const result = interaktOnlyError(phoneNumber, 'Interakt API not configured');
    trackWhatsAppSend(trackType, phoneNumber, result);
    return result;
  }

  const templateName = options.templateName || EMERGENCY_TEMPLATE_NAME;

  if (!templateName) {
    console.error('❌ No WhatsApp template configured. Set EMERGENCY_TEMPLATE_NAME (or application templates) in .env');
    const result = interaktOnlyError(phoneNumber, 'No Interakt template configured');
    trackWhatsAppSend(trackType, phoneNumber, result);
    return result;
  }

  console.log(`📤 Attempting to send via Interakt API with template: ${templateName}`);
  
  // If template is provided, try to use Interakt API
  let templateData = options.templateData || {};
  
  if (!templateData.bodyValues && message) {
    const messageLines = message.split('\n').filter(line => line.trim());
    templateData.bodyValues = messageLines.slice(0, 10);
    if (templateData.bodyValues.length === 0) {
      templateData.bodyValues = [message];
    }
  }
  
  if (!templateData.bodyValues || !Array.isArray(templateData.bodyValues)) {
    templateData.bodyValues = [message || 'Emergency alert'];
  }
  
  let buttonValues = {};
  if (templateData.buttonValues && Array.isArray(templateData.buttonValues) && templateData.buttonValues.length > 0) {
    templateData.buttonValues.forEach((value, index) => {
      buttonValues[index.toString()] = Array.isArray(value) ? value : [value];
    });
  } else if (templateData.buttonValues && typeof templateData.buttonValues === 'object') {
    buttonValues = templateData.buttonValues;
  }
  
  const payload = {
    countryCode: countryCode,
    phoneNumber: cleanPhone,
    callbackData: options.callbackData || `emergency_${Date.now()}`,
    type: 'Template',
    template: {
      name: templateName,
      languageCode: options.languageCode || 'en',
      headerValues: templateData.headerValues || [],
      bodyValues: templateData.bodyValues || [],
      buttonValues: buttonValues
    }
  };
  
  if (WHATSAPP_DEBUG) {
    console.log(`\n📤 Interakt API Request Details:`);
    console.log(`   URL: ${INTERAKT_API_URL}`);
    console.log(`   Template: ${templateName}`);
    console.log(`   Phone: ${countryCode}${cleanPhone}`);
    console.log(`   Body Values (${templateData.bodyValues?.length || 0}):`, templateData.bodyValues);
    console.log(`   Header Values (${templateData.headerValues?.length || 0}):`, templateData.headerValues);
  }
  
  try {
    const apiUrl = new URL(INTERAKT_API_URL);
    const payloadString = JSON.stringify(payload);
    if (WHATSAPP_DEBUG) {
      console.log(`   Payload: ${payloadString.substring(0, 500)}...`); // Log first 500 chars
    }
    
    const requestOptions = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${INTERAKT_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString)
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (WHATSAPP_DEBUG) {
              console.log(`📥 Interakt API Response (${res.statusCode}):`, JSON.stringify(parsedData).substring(0, 500));
            }
            resolve({ statusCode: res.statusCode, data: parsedData });
          } catch (e) {
            if (WHATSAPP_DEBUG) {
              console.log(`📥 Interakt API Response (${res.statusCode}):`, data.substring(0, 500));
            }
            resolve({ statusCode: res.statusCode, data: data });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(payloadString);
      req.end();
    });
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      const successResult = {
        success: true,
        message: 'WhatsApp message sent successfully via Interakt',
        phoneNumber: `${countryCode}${cleanPhone}`,
        messageId: response.data?.messageId || response.data?.id || 'unknown',
        response: response.data,
        method: 'interakt_api',
      };
      console.log(`✅ WhatsApp message sent successfully via Interakt to ${countryCode}${cleanPhone}`);
      trackWhatsAppSend(trackType, phoneNumber, successResult);
      return successResult;
    } else {
      const errorDetails = JSON.stringify(response.data);
      console.error(`❌ Interakt API Error - Status: ${response.statusCode}`);
      console.error(`❌ Error Details: ${errorDetails}`);
      throw new Error(`Interakt API returned status ${response.statusCode}: ${errorDetails}`);
    }
  } catch (apiError) {
    console.error('❌ Interakt API Error:', apiError.message || apiError);
    if (apiError.message && apiError.message.includes('template')) {
      console.error('❌ Template not found or not approved. Create/approve template at https://app.interakt.ai/templates/list');
      console.error('   Template attempted: ' + templateName);
    }
    const failResult = interaktOnlyError(phoneNumber, apiError.message || 'Interakt API request failed');
    trackWhatsAppSend(trackType, phoneNumber, failResult);
    return failResult;
  }
};

/**
 * Send WhatsApp message via Interakt API only (no direct link).
 */
const sendWhatsAppMessage = async (phoneNumber, message, options = {}) => {
  try {
    const { countryCode, phoneNumber: cleanPhone } = formatPhoneNumber(phoneNumber);

    const trackType = options.trackType || options.type || 'unknown';

    if (!cleanPhone || cleanPhone.length < 10) {
      const result = { success: false, message: 'Invalid phone number format', phoneNumber };
      trackWhatsAppSend(trackType, phoneNumber, result);
      return result;
    }

    if (!INTERAKT_API_KEY) {
      const result = interaktOnlyError(phoneNumber, 'Interakt API not configured');
      trackWhatsAppSend(trackType, phoneNumber, result);
      return result;
    }

    if (options.type === 'emergency' || options.priority === 'critical') {
      const templateName = options.templateName || EMERGENCY_TEMPLATE_NAME;
      if (!templateName) {
        const result = interaktOnlyError(phoneNumber, 'Set EMERGENCY_TEMPLATE_NAME in .env for emergency alerts');
        trackWhatsAppSend(trackType, phoneNumber, result);
        return result;
      }
      console.log('🚨 Sending emergency alert via Interakt...');
      let templateData = options.templateData;
      if (!templateData || !templateData.bodyValues) {
        const messageLines = message.split('\n').filter(line => line.trim());
        templateData = {
          bodyValues: (messageLines.length > 0 ? messageLines : [message]).slice(0, 10),
          headerValues: [],
          buttonValues: {}
        };
      }
      return await sendWhatsAppViaInterakt(phoneNumber, message, {
        ...options,
        trackType: trackType,
        templateName,
        templateData
      });
    }

    if (options.templateName || EMERGENCY_TEMPLATE_NAME) {
      return await sendWhatsAppViaInterakt(phoneNumber, message, { ...options, trackType });
    }

    const result = interaktOnlyError(phoneNumber, 'No template configured for this message type');
    trackWhatsAppSend(trackType, phoneNumber, result);
    return result;
  } catch (error) {
    console.error('❌ WhatsApp Service Error:', error);
    const result = interaktOnlyError(phoneNumber, error.message);
    trackWhatsAppSend(options.trackType || options.type || 'unknown', phoneNumber, result);
    return result;
  }
};

/**
 * Log WhatsApp message to server console only (no link exposed).
 */
const logWhatsAppMessage = (phoneNumber, message, options, isEmergency = false) => {
  const { countryCode, phoneNumber: cleanPhone } = formatPhoneNumber(phoneNumber);
  const fullNumber = `${countryCode}${cleanPhone}`;
  const logPrefix = isEmergency ? '🚨' : '💬';
  const logTitle = isEmergency ? 'EMERGENCY WHATSAPP ALERT' : 'WHATSAPP SERVICE';
  console.log(`\n${logPrefix} ${logTitle} | TO: ${fullNumber}`);
  console.log(`${logPrefix} MESSAGE: ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}\n`);
  return {
    success: false,
    message: 'WhatsApp via Interakt only; message logged to server',
    phoneNumber: fullNumber,
  };
};

/**
 * Send application confirmation via Interakt (template body: {{1}}=name, {{2}}=applicationId, {{3}}=trackUrl).
 */
const sendApplicationConfirmationWhatsApp = async (applicationData) => {
  const phoneNumber = applicationData.mobileNumber;
  const applicantName = applicationData.fullName || 'Applicant';
  const applicationId = String(applicationData.id || applicationData.submissionId || '');
  const trackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/apply/success?applicationId=${applicationId}`;

  if (!phoneNumber) {
    return { success: false, message: 'No phone number provided' };
  }

  const message = `Application submitted. Dear ${applicantName}, Application ID: ${applicationId}. Track: ${trackUrl}`;

  return await sendWhatsAppMessage(phoneNumber, message, {
    trackType: 'application_confirmation',
    templateName: APPLICATION_CONFIRMATION_TEMPLATE,
    templateData: {
      bodyValues: [applicantName, applicationId, trackUrl],
      headerValues: [],
      buttonValues: {}
    }
  });
};

/**
 * Send rejection notification via Interakt (template body: {{1}}=name, {{2}}=applicationId, {{3}}=reason).
 */
const sendRejectionWhatsApp = async (applicationData, rejectionReason) => {
  const phoneNumber = applicationData.mobileNumber;
  const applicantName = applicationData.fullName || 'Applicant';
  const applicationId = String(applicationData.id || applicationData.submissionId || '');
  const reasonText = (rejectionReason && rejectionReason.trim()) ? rejectionReason.trim() : 'Thank you for your interest.';

  if (!phoneNumber) {
    return { success: false, message: 'No phone number provided' };
  }

  const message = `Application update. Dear ${applicantName}, Application ${applicationId} was not selected. ${reasonText}`;

  return await sendWhatsAppMessage(phoneNumber, message, {
    trackType: 'application_rejection',
    templateName: APPLICATION_REJECTION_TEMPLATE,
    templateData: {
      bodyValues: [applicantName, applicationId, reasonText],
      headerValues: [],
      buttonValues: {}
    }
  });
};

module.exports = {
  sendWhatsAppMessage,
  sendApplicationConfirmationWhatsApp,
  sendRejectionWhatsApp,
};
