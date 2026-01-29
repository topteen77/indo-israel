/**
 * WhatsApp Service
 * Logs WhatsApp messages to console until fully implemented
 */

/**
 * Send WhatsApp message
 */
const sendWhatsAppMessage = async (phoneNumber, message, options = {}) => {
  const formattedPhone = phoneNumber.replace(/[^0-9+]/g, '');
  
  console.log('\n💬 ============================================');
  console.log('💬 WHATSAPP SERVICE (Console Preview Mode)');
  console.log('💬 ============================================');
  console.log('💬 WhatsApp service is not enabled. Showing preview:');
  console.log('💬 To enable: Configure WHATSAPP_API_KEY in .env');
  console.log('💬 ============================================');
  console.log('💬 TO:', formattedPhone);
  console.log('💬 FROM:', process.env.RECRUITMENT_WHATSAPP || '+91 11 4747 4700');
  console.log('💬 ============================================');
  console.log('💬 MESSAGE:');
  console.log('💬 ============================================');
  console.log(`💬 ${message}`);
  console.log('💬 ============================================');
  if (options.mediaUrl) {
    console.log('💬 MEDIA URL:', options.mediaUrl);
  }
  if (options.template) {
    console.log('💬 TEMPLATE:', options.template);
  }
  console.log('💬 ============================================');
  console.log('💬 WhatsApp message would be sent via API');
  console.log('💬 ============================================\n');
  
  return {
    success: true,
    message: 'WhatsApp preview logged to console (service not enabled)',
    preview: true,
    phoneNumber: formattedPhone,
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
    template: 'application_confirmation',
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
    template: 'application_rejection',
  });
};

module.exports = {
  sendWhatsAppMessage,
  sendApplicationConfirmationWhatsApp,
  sendRejectionWhatsApp,
};
