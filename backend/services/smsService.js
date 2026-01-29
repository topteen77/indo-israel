/**
 * SMS Service
 * Logs SMS messages to console until fully implemented
 */

/**
 * Format emergency SMS message
 */
const formatEmergencySMS = (emergencyData, language = 'en') => {
  const { workerName, workerId, location, timestamp } = emergencyData;
  
  if (language === 'he') {
    return `🚨 חירום! העובד ${workerName} דורש עזרה מיידית.
מיקום: ${location.latitude}, ${location.longitude}
זמן: ${timestamp}
פנה למוקד החירום: ${process.env.ISRAEL_EMERGENCY_NUMBER || '100'}
מספר מזהה: ${workerId}`;
  }
  
  return `🚨 EMERGENCY! Worker ${workerName} requires immediate assistance.
Location: ${location.latitude}, ${location.longitude}
Time: ${timestamp}
Contact emergency: ${process.env.ISRAEL_EMERGENCY_NUMBER || '100'}
ID: ${workerId}`;
};

/**
 * Send SMS message
 */
const sendSMS = async (phoneNumber, message, options = {}) => {
  const formattedPhone = phoneNumber.replace(/[^0-9+]/g, '');
  
  console.log('\n📱 ============================================');
  console.log('📱 SMS SERVICE (Console Preview Mode)');
  console.log('📱 ============================================');
  console.log('📱 SMS service is not enabled. Showing preview:');
  console.log('📱 To enable: Configure TWILIO_ACCOUNT_SID in .env');
  console.log('📱 ============================================');
  console.log('📱 TO:', formattedPhone);
  console.log('📱 FROM:', process.env.TWILIO_PHONE_NUMBER || 'Apravas');
  console.log('📱 ============================================');
  console.log('📱 MESSAGE:');
  console.log('📱 ============================================');
  console.log(`📱 ${message}`);
  console.log('📱 ============================================');
  if (options.priority) {
    console.log('📱 PRIORITY:', options.priority);
  }
  console.log('📱 ============================================');
  console.log('📱 SMS would be sent via Twilio API');
  console.log('📱 ============================================\n');
  
  return {
    success: true,
    message: 'SMS preview logged to console (service not enabled)',
    preview: true,
    phoneNumber: formattedPhone,
  };
};

/**
 * Send emergency SMS
 */
const sendEmergencySMS = async (emergencyData, recipients = []) => {
  const messages = [];
  
  // Send in both Hebrew and English
  const hebrewMessage = formatEmergencySMS(emergencyData, 'he');
  const englishMessage = formatEmergencySMS(emergencyData, 'en');
  
  // Default recipients if none provided
  const defaultRecipients = [
    process.env.ISRAEL_EMERGENCY_NUMBER || '100',
    process.env.RECRUITMENT_PHONE || '+91 11 4747 4700',
  ];
  
  const allRecipients = recipients.length > 0 ? recipients : defaultRecipients;
  
  for (const recipient of allRecipients) {
    // Send English version
    const result = await sendSMS(recipient, englishMessage, {
      priority: 'critical',
      type: 'emergency',
    });
    messages.push(result);
  }
  
  return {
    success: true,
    messagesSent: messages.length,
    preview: true,
    message: 'Emergency SMS preview logged to console',
  };
};

module.exports = {
  sendSMS,
  sendEmergencySMS,
  formatEmergencySMS,
};
