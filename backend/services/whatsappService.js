/**
 * WhatsApp Service using Interakt API
 * Sends real WhatsApp messages via Interakt API
 */

const https = require('https');

// Interakt API Configuration
// IMPORTANT: Do NOT hardcode API keys in code. Require env var in production.
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY;
const INTERAKT_API_URL = 'https://api.interakt.ai/v1/public/message/';
const WHATSAPP_DEBUG = process.env.WHATSAPP_DEBUG === 'true';

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
 * Send WhatsApp message directly via WhatsApp Web link (no template required)
 * This creates a clickable link that opens WhatsApp with the message pre-filled
 * For emergency alerts, this is the most reliable method without templates
 */
const sendWhatsAppDirect = async (phoneNumber, message, options = {}) => {
  const { countryCode, phoneNumber: cleanPhone } = formatPhoneNumber(phoneNumber);
  const fullNumber = `${countryCode}${cleanPhone}`;
  const cleanNumberForLink = fullNumber.replace(/\+/g, '').replace(/\s/g, '');
  
  // Create WhatsApp Web link
  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://wa.me/${cleanNumberForLink}?text=${encodedMessage}`;
  
  // For emergency alerts, log prominently and return the link
  if (options.type === 'emergency' || options.priority === 'critical') {
    console.log('\n🚨 ============================================');
    console.log('🚨 EMERGENCY WHATSAPP ALERT - READY TO SEND');
    console.log('🚨 ============================================');
    console.log(`🚨 TO: ${fullNumber}`);
    console.log(`🚨 WHATSAPP LINK: ${whatsappLink}`);
    console.log('🚨 ============================================');
    console.log('🚨 MESSAGE:');
    console.log('🚨 ============================================');
    console.log(message);
    console.log('🚨 ============================================');
    console.log('🚨 Copy the WhatsApp link above and open it to send the message');
    console.log('🚨 Or use automation tools to open this link programmatically');
    console.log('🚨 ============================================\n');
    
    return {
      success: true,
      message: 'Emergency WhatsApp alert link generated',
      phoneNumber: fullNumber,
      whatsappLink: whatsappLink,
      method: 'direct_link',
    };
  }
  
  return {
    success: true,
    message: 'WhatsApp link generated',
    phoneNumber: fullNumber,
    whatsappLink: whatsappLink,
    method: 'direct_link',
  };
};

/**
 * Send WhatsApp message via Interakt API (requires template)
 * Falls back to direct link if template is not available
 */
const sendWhatsAppViaInterakt = async (phoneNumber, message, options = {}) => {
  const { countryCode, phoneNumber: cleanPhone } = formatPhoneNumber(phoneNumber);
  
  // Check if Interakt API is configured
  if (!INTERAKT_API_KEY) {
    console.log('⚠️ Interakt API key not configured, using direct WhatsApp link');
    return sendWhatsAppDirect(phoneNumber, message, options);
  }
  
  // Try to use a simple template if provided, otherwise use direct link
  const templateName = options.templateName || process.env.EMERGENCY_TEMPLATE_NAME;
  
  if (!templateName) {
    // No template specified, use direct link method
    console.log('⚠️ No template specified, using direct WhatsApp link (no template required)');
    console.log('💡 To send via Interakt API, create a template in Interakt dashboard and set EMERGENCY_TEMPLATE_NAME in .env');
    return sendWhatsAppDirect(phoneNumber, message, options);
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
      console.log(`✅ WhatsApp message sent successfully via Interakt to ${countryCode}${cleanPhone}`);
      console.log(`✅ Message ID: ${response.data?.messageId || response.data?.id || 'unknown'}`);
      return {
        success: true,
        message: 'WhatsApp message sent successfully via Interakt',
        phoneNumber: `${countryCode}${cleanPhone}`,
        messageId: response.data?.messageId || response.data?.id || 'unknown',
        response: response.data,
        method: 'interakt_api',
      };
    } else {
      const errorDetails = JSON.stringify(response.data);
      console.error(`❌ Interakt API Error - Status: ${response.statusCode}`);
      console.error(`❌ Error Details: ${errorDetails}`);
      throw new Error(`Interakt API returned status ${response.statusCode}: ${errorDetails}`);
    }
  } catch (apiError) {
    console.error('❌ Interakt API Error:', apiError.message || apiError);
    if (apiError.message && apiError.message.includes('template')) {
      console.error('❌ Template not found or not approved. You need to create a template in Interakt dashboard.');
      console.error('❌ Template name attempted: ' + templateName);
    }
    // Fallback to direct link
    console.log('⚠️ Falling back to direct WhatsApp link method');
    return sendWhatsAppDirect(phoneNumber, message, options);
  }
};

/**
 * Send WhatsApp message - Main function
 * Tries Interakt API first, falls back to direct link if API fails
 */
const sendWhatsAppMessage = async (phoneNumber, message, options = {}) => {
  try {
    const { countryCode, phoneNumber: cleanPhone } = formatPhoneNumber(phoneNumber);
    
    // Validate phone number
    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        message: 'Invalid phone number format',
        phoneNumber: phoneNumber,
      };
    }
    
    // Check if Interakt API is configured
    if (!INTERAKT_API_KEY) {
      console.log('⚠️ Interakt API key not configured, using direct WhatsApp link');
      return await sendWhatsAppDirect(phoneNumber, message, options);
    }
    
    // For emergency alerts, try to send via Interakt API first
    if (options.type === 'emergency' || options.priority === 'critical') {
      console.log('🚨 Attempting to send emergency alert via Interakt API...');
      
      // Check if a template name is provided via environment variable
      const templateName = options.templateName || process.env.EMERGENCY_TEMPLATE_NAME;
      
      if (templateName) {
        console.log(`📋 Using template: ${templateName}`);
        // Use templateData from options if provided, otherwise create from message
        let templateData = options.templateData;
        if (!templateData || !templateData.bodyValues) {
          // Fallback: create templateData from message if not provided
          const messageLines = message.split('\n').filter(line => line.trim());
          const bodyValues = messageLines.length > 0 ? messageLines : [message];
          templateData = {
            bodyValues: bodyValues.slice(0, 10), // Max 10 body variables
            headerValues: [],
            buttonValues: {}
          };
        }
        
        const interaktResult = await sendWhatsAppViaInterakt(phoneNumber, message, {
          ...options,
          templateName: templateName,
          templateData: templateData
        });
        
        // If Interakt API succeeded, return the result
        if (interaktResult.success && interaktResult.method === 'interakt_api') {
          return interaktResult;
        }
        
        // If Interakt failed, fall back to direct link
        console.log('⚠️ Interakt API failed, using direct WhatsApp link method');
        return await sendWhatsAppDirect(phoneNumber, message, options);
      } else {
        // No template specified - use direct link method
        console.log('⚠️ No template specified. To send via Interakt API:');
        console.log('   1. Create a template in Interakt dashboard');
        console.log('   2. Set EMERGENCY_TEMPLATE_NAME=your_template_name in .env file');
        console.log('   3. Or provide templateName in options');
        console.log('   Using direct WhatsApp link method (requires manual click)...');
        return await sendWhatsAppDirect(phoneNumber, message, options);
      }
    }
    
    // For other messages, try Interakt API if template is provided
    if (options.templateName || process.env.EMERGENCY_TEMPLATE_NAME) {
      return await sendWhatsAppViaInterakt(phoneNumber, message, options);
    }
    
    // Default: use direct link method
    return await sendWhatsAppDirect(phoneNumber, message, options);
  } catch (error) {
    console.error('❌ WhatsApp Service Error:', error);
    return {
      success: false,
      message: 'Failed to send WhatsApp message',
      error: error.message,
      phoneNumber: phoneNumber,
    };
  }
};

/**
 * Log WhatsApp message to console (fallback)
 */
const logWhatsAppMessage = (phoneNumber, message, options, isEmergency = false) => {
  const { countryCode, phoneNumber: cleanPhone } = formatPhoneNumber(phoneNumber);
  const fullNumber = `${countryCode}${cleanPhone}`;
  const whatsappLink = `https://wa.me/${fullNumber.replace(/\+/g, '')}?text=${encodeURIComponent(message.substring(0, 1000))}`;
  
  const logPrefix = isEmergency ? '🚨' : '💬';
  const logTitle = isEmergency ? 'EMERGENCY WHATSAPP ALERT' : 'WHATSAPP SERVICE';
  
  console.log(`\n${logPrefix} ============================================`);
  console.log(`${logPrefix} ${logTitle}`);
  console.log(`${logPrefix} ============================================`);
  console.log(`${logPrefix} TO: ${fullNumber}`);
  console.log(`${logPrefix} MESSAGE:`);
  console.log(`${logPrefix} ============================================`);
  console.log(message);
  console.log(`${logPrefix} ============================================`);
  console.log(`${logPrefix} WhatsApp Link: ${whatsappLink}`);
  console.log(`${logPrefix} ============================================\n`);
  
  return {
    success: true,
    message: isEmergency 
      ? 'Emergency WhatsApp alert logged (Interakt API failed or not configured)' 
      : 'WhatsApp message logged (Interakt API not configured)',
    phoneNumber: fullNumber,
    whatsappLink: whatsappLink,
    preview: true,
  };
};

/**
 * Send application confirmation via WhatsApp
 */
const sendApplicationConfirmationWhatsApp = async (applicationData) => {
  const phoneNumber = applicationData.mobileNumber;
  const applicantName = applicationData.fullName || 'Applicant';
  const applicationId = applicationData.id || applicationData.submissionId;

  if (!phoneNumber) {
    console.log('❌ WHATSAPP SERVICE: No phone number provided');
    return { success: false, message: 'No phone number provided' };
  }

  const message = `🎉 *Application Submitted Successfully!*

Dear ${applicantName},

Thank you for registering with Apravas. Your application has been received.

*Application ID:* ${applicationId}

Our recruitment team will review your profile and contact shortlisted candidates within *7-10 working days*.

*Important Notes:*
• Keep your phone active for communication
• Prepare for skill tests/interviews if shortlisted
• Ensure passport validity for visa processing

*Track Application:*
${process.env.FRONTEND_URL || 'http://localhost:3000'}/apply/success?applicationId=${applicationId}

*Contact Us:*
Phone: ${process.env.RECRUITMENT_PHONE || '+91 11 4747 4700'}
Email: ${process.env.RECRUITMENT_EMAIL || 'recruitment@apravas.com'}

Best regards,
Apravas Recruitment Team`;

  return await sendWhatsAppMessage(phoneNumber, message, {
    templateName: 'application_confirmation',
  });
};

/**
 * Send rejection notification via WhatsApp
 */
const sendRejectionWhatsApp = async (applicationData, rejectionReason) => {
  const phoneNumber = applicationData.mobileNumber;
  const applicantName = applicationData.fullName || 'Applicant';
  const applicationId = applicationData.id || applicationData.submissionId;

  if (!phoneNumber) {
    console.log('❌ WHATSAPP SERVICE: No phone number provided');
    return { success: false, message: 'No phone number provided' };
  }

  const message = `📋 *Application Status Update*

Dear ${applicantName},

Thank you for your interest in working with Apravas.

*Application ID:* ${applicationId}

After careful review, we regret to inform you that your application was not selected for this position.${rejectionReason ? `\n\n*Reason:* ${rejectionReason}` : ''}

We encourage you to apply for future opportunities.

*Appeal Process:*
If you believe there was an error, you can appeal within 7 days.

*Contact:*
${process.env.RECRUITMENT_EMAIL || 'recruitment@apravas.com'}

Best regards,
Apravas Recruitment Team`;

  return await sendWhatsAppMessage(phoneNumber, message, {
    templateName: 'application_rejection',
  });
};

module.exports = {
  sendWhatsAppMessage,
  sendApplicationConfirmationWhatsApp,
  sendRejectionWhatsApp,
};
