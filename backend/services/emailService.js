const nodemailer = require('nodemailer');
const { loadTemplate, prepareTemplateData } = require('../utils/templateLoader');
const path = require('path');

// Email service configuration
let transporter = null;

const initializeEmailService = () => {
  // Check if email service is enabled
  if (process.env.EMAIL_SERVICE_ENABLED !== 'true') {
    console.log('Email service is disabled. Set EMAIL_SERVICE_ENABLED=true to enable.');
    return false;
  }

  // Create transporter
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_HOST_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASS,
    },
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email service configuration error:', error);
    } else {
      console.log('✅ Email service is ready to send messages');
    }
  });

  return true;
};

// Initialize on module load (server.js also calls initializeEmailService() after dotenv for correct order)
if (process.env.EMAIL_SERVICE_ENABLED === 'true') {
  initializeEmailService();
}

/**
 * Send a test email (e.g. to verify SES/SMTP). To: RECRUITMENT_EMAIL or provided address.
 */
const sendTestEmail = async (toEmail = null) => {
  const to = toEmail || process.env.RECRUITMENT_EMAIL || 'recruitment@apravas.com';
  if (!transporter || process.env.EMAIL_SERVICE_ENABLED !== 'true') {
    console.log('📧 Email service not enabled; test email skipped. Set EMAIL_SERVICE_ENABLED=true in .env');
    return { success: false, message: 'Email service not enabled', preview: true };
  }
  try {
    const from = process.env.DEFAULT_FROM_EMAIL || `"Apravas" <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Apravas – Test email (SES/SMTP)',
      text: `This is a test email from the Apravas backend. If you received this, SES/SMTP is configured correctly.\n\nSent at ${new Date().toISOString()}`,
      html: `<p>This is a test email from the Apravas backend.</p><p>If you received this, SES/SMTP is configured correctly.</p><p><em>Sent at ${new Date().toISOString()}</em></p>`,
    });
    console.log('✅ Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Test email failed:', error);
    throw error;
  }
};

/**
 * Send application confirmation email
 */
const sendApplicationConfirmation = async (applicationData) => {
  const applicationId = applicationData.id || applicationData.submissionId;
  const applicantName = applicationData.fullName || 'Applicant';
  const applicantEmail = applicationData.email;

  if (!applicantEmail) {
    console.log('❌ EMAIL SERVICE: No email address provided');
    return { success: false, message: 'No email address provided' };
  }

  // If email service is not configured, log to console instead
  if (!transporter || process.env.EMAIL_SERVICE_ENABLED !== 'true') {
    console.log('\n📧 ============================================');
    console.log('📧 EMAIL SERVICE (Console Preview Mode)');
    console.log('📧 ============================================');
    console.log('📧 Email service is not enabled. Showing preview:');
    console.log('📧 To enable: Set EMAIL_SERVICE_ENABLED=true in .env');
    console.log('📧 ============================================');
    console.log('📧 TO:', applicantEmail);
    console.log('📧 FROM:', `"Apravas Recruitment" <${process.env.SMTP_USER || 'recruitment@apravas.com'}>`);
    console.log('📧 SUBJECT: Application Submitted Successfully - Apravas Recruitment');
    console.log('📧 ============================================');
    console.log('📧 EMAIL CONTENT:');
    console.log('📧 ============================================');
    console.log(`📧 Dear ${applicantName},`);
    console.log('📧 Thank you for registering with Apravas. Your application has been received and is under review.');
    console.log(`📧 Application ID: ${applicationId}`);
    console.log('📧 Our recruitment team will review your profile and contact shortlisted candidates within 7-10 working days.');
    console.log('📧 Important Notes:');
    console.log('📧   - Submission does not guarantee selection');
    console.log('📧   - Keep your phone active for WhatsApp/email communication');
    console.log('📧   - Prepare for skill tests/interviews if shortlisted');
    console.log('📧   - Ensure passport validity for visa processing');
    console.log(`📧 Track Application: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/apply/success?applicationId=${applicationId}`);
    console.log('📧 Contact:');
    console.log(`📧   Phone: ${process.env.RECRUITMENT_PHONE || '+91 11 4747 4700'}`);
    console.log(`📧   Email: ${process.env.RECRUITMENT_EMAIL || 'recruitment@apravas.com'}`);
    console.log(`📧   WhatsApp: ${process.env.RECRUITMENT_WHATSAPP || '+91 11 4747 4700'}`);
    console.log('📧 ============================================');
    console.log('📧 HTML Email would be sent with full formatting');
    console.log('📧 ============================================\n');
    
    return {
      success: true,
      message: 'Email preview logged to console (service not enabled)',
      preview: true,
    };
  }

  try {
    // Prepare template data
    const templateData = prepareTemplateData({
      applicantName,
      applicationId,
      submittedDate: applicationData.submittedAt
        ? new Date(applicationData.submittedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
      trackingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/apply/success?applicationId=${applicationId}`,
    });

    // Load HTML template
    let html;
    try {
      html = loadTemplate('confirmation', 'emails', templateData);
    } catch (templateError) {
      console.warn('Failed to load template, using fallback:', templateError.message);
      // Fallback to inline HTML if template fails
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #7B0FF5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .application-id { background-color: #7B0FF5; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .info-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #7B0FF5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Submitted Successfully!</h1>
            </div>
            <div class="content">
              <p>Dear ${applicantName},</p>
              <p>Thank you for registering with Apravas. Your application has been received and is under review.</p>
              <div class="application-id">Application ID: ${applicationId}</div>
              <h3>What's Next?</h3>
              <p>Our recruitment team will review your profile and contact shortlisted candidates within <strong>7-10 working days</strong>.</p>
              <div class="info-box">
                <h4>Important Notes:</h4>
                <ul>
                  <li>Submission does not guarantee selection</li>
                  <li>Keep your phone active for WhatsApp/email communication</li>
                  <li>Prepare for skill tests/interviews if shortlisted</li>
                  <li>Ensure passport validity for visa processing</li>
                </ul>
              </div>
              <p><a href="${templateData.trackingUrl}" class="button">Track Your Application</a></p>
              <h3>Contact Us</h3>
              <p><strong>Phone:</strong> ${templateData.recruitmentPhone}<br>
              <strong>Email:</strong> ${templateData.recruitmentEmail}<br>
              <strong>WhatsApp:</strong> ${templateData.recruitmentWhatsApp}</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${templateData.currentYear} Apravas Recruitment Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const mailOptions = {
      from: process.env.DEFAULT_FROM_EMAIL || `"Apravas Recruitment" <${process.env.SMTP_USER}>`,
      to: applicantEmail,
      subject: 'Application Submitted Successfully - Apravas Recruitment',
      html,
      text: `
        Application Submitted Successfully!
        
        Dear ${applicantName},
        
        Thank you for registering with Apravas. Your application has been received.
        
        Application ID: ${applicationId}
        
        Our recruitment team will review your profile and contact shortlisted candidates within 7-10 working days.
        
        Important Notes:
        - Submission does not guarantee selection
        - Keep your phone active for WhatsApp/email communication
        - Prepare for skill tests/interviews if shortlisted
        - Ensure passport validity for visa processing
        
        Track your application: ${templateData.trackingUrl}
        
        Contact Us:
        Phone: ${templateData.recruitmentPhone}
        Email: ${templateData.recruitmentEmail}
        WhatsApp: ${templateData.recruitmentWhatsApp}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Confirmation email sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send confirmation email',
    };
  }
};

/**
 * Send rejection email
 */
const sendRejectionEmail = async (applicationData, rejectionReason) => {
  const applicationId = applicationData.id || applicationData.submissionId;
  const applicantName = applicationData.fullName || 'Applicant';
  const applicantEmail = applicationData.email;

  if (!applicantEmail) {
    console.log('❌ EMAIL SERVICE: No email address provided for rejection email');
    return { success: false, message: 'No email address provided' };
  }

  // If email service is not configured, log to console instead
  if (!transporter || process.env.EMAIL_SERVICE_ENABLED !== 'true') {
    console.log('\n📧 ============================================');
    console.log('📧 REJECTION EMAIL (Console Preview Mode)');
    console.log('📧 ============================================');
    console.log('📧 Email service is not enabled. Showing preview:');
    console.log('📧 ============================================');
    console.log('📧 TO:', applicantEmail);
    console.log('📧 FROM:', `"Apravas Recruitment" <${process.env.SMTP_USER || 'recruitment@apravas.com'}>`);
    console.log('📧 SUBJECT: Application Status Update - Apravas Recruitment');
    console.log('📧 ============================================');
    console.log('📧 EMAIL CONTENT:');
    console.log('📧 ============================================');
    console.log(`📧 Dear ${applicantName},`);
    console.log('📧 Thank you for your interest in working with Apravas.');
    console.log(`📧 Application ID: ${applicationId}`);
    console.log('📧 After careful review, we regret to inform you that your application was not selected for this position.');
    if (rejectionReason) {
      console.log(`📧 Reason: ${rejectionReason}`);
    }
    console.log('📧 We encourage you to apply for future opportunities.');
    console.log('📧 Appeal Process: If you believe there was an error, you can appeal within 7 days.');
    console.log(`📧 Contact: ${process.env.RECRUITMENT_EMAIL || 'recruitment@apravas.com'}`);
    console.log('📧 ============================================');
    console.log('📧 PDF Rejection Letter would be attached');
    console.log('📧 ============================================\n');
    
    return {
      success: true,
      message: 'Rejection email preview logged to console (service not enabled)',
      preview: true,
    };
  }

  try {
    // Calculate appeal deadline (7 days from now)
    const appealDeadline = new Date();
    appealDeadline.setDate(appealDeadline.getDate() + 7);
    const appealDeadlineStr = appealDeadline.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Prepare template data
    const templateData = prepareTemplateData({
      applicantName,
      applicationId,
      rejectionReason: rejectionReason || 'After careful review, your application was not selected for this position.',
      appealDeadline: appealDeadlineStr,
      appealUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appeal/${applicationId}`,
    });

    // Load HTML template
    let html;
    try {
      html = loadTemplate('rejection', 'emails', templateData);
    } catch (templateError) {
      console.warn('Failed to load rejection template, using fallback:', templateError.message);
      // Fallback HTML
      html = `
        <!DOCTYPE html>
        <html>
        <head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }</style></head>
        <body>
          <h2>Application Status Update</h2>
          <p>Dear ${applicantName},</p>
          <p>Thank you for your interest. After careful review, we regret to inform you that your application was not selected.</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>You can appeal this decision within 7 days: <a href="${templateData.appealUrl}">${templateData.appealUrl}</a></p>
          <p>Contact: ${templateData.recruitmentEmail} | ${templateData.recruitmentPhone}</p>
        </body>
        </html>
      `;
    }

    const mailOptions = {
      from: process.env.DEFAULT_FROM_EMAIL || `"Apravas Recruitment" <${process.env.SMTP_USER}>`,
      to: applicantEmail,
      subject: 'Application Status Update - Apravas Recruitment',
      html,
      text: `
        Application Status Update
        
        Dear ${applicantName},
        
        Thank you for your interest in working with Apravas.
        
        Application ID: ${applicationId}
        
        After careful review, we regret to inform you that your application was not selected for this position.
        ${rejectionReason ? `\nReason: ${rejectionReason}` : ''}
        
        Appeal Process: If you believe there was an error, you can appeal within 7 days.
        Appeal Deadline: ${appealDeadlineStr}
        Appeal URL: ${templateData.appealUrl}
        
        Contact Us:
        Phone: ${templateData.recruitmentPhone}
        Email: ${templateData.recruitmentEmail}
        WhatsApp: ${templateData.recruitmentWhatsApp}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Rejection email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Rejection email sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send rejection email',
    };
  }
};

/**
 * Send appeal confirmation email
 */
const sendAppealConfirmation = async (appealData) => {
  const appealId = appealData.id || appealData.appealId;
  const applicationId = appealData.applicationId;
  const applicantName = appealData.applicantName || appealData.fullName || 'Applicant';
  const applicantEmail = appealData.email || appealData.applicantEmail;

  if (!applicantEmail) {
    console.log('❌ EMAIL SERVICE: No email address provided for appeal confirmation');
    return { success: false, message: 'No email address provided' };
  }

  // If email service is not configured, log to console instead
  if (!transporter || process.env.EMAIL_SERVICE_ENABLED !== 'true') {
    console.log('\n📧 ============================================');
    console.log('📧 APPEAL CONFIRMATION EMAIL (Console Preview Mode)');
    console.log('📧 ============================================');
    console.log('📧 TO:', applicantEmail);
    console.log('📧 SUBJECT: Appeal Submitted Successfully - Apravas Recruitment');
    console.log(`📧 Appeal ID: ${appealId}`);
    console.log(`📧 Application ID: ${applicationId}`);
    console.log('📧 Your appeal is under review. Response within 5-7 working days.');
    console.log('📧 ============================================\n');
    
    return {
      success: true,
      message: 'Appeal confirmation email preview logged to console (service not enabled)',
      preview: true,
    };
  }

  try {
    // Prepare template data
    const templateData = prepareTemplateData({
      applicantName,
      appealId,
      applicationId,
      submittedDate: appealData.submittedAt
        ? new Date(appealData.submittedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
    });

    // Load HTML template
    let html;
    try {
      html = loadTemplate('appeal-confirmation', 'emails', templateData);
    } catch (templateError) {
      console.warn('Failed to load appeal confirmation template, using fallback:', templateError.message);
      // Fallback HTML
      html = `
        <!DOCTYPE html>
        <html>
        <head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }</style></head>
        <body>
          <h2>Appeal Submitted Successfully!</h2>
          <p>Dear ${applicantName},</p>
          <p>Your appeal has been received and is under review.</p>
          <p><strong>Appeal ID:</strong> ${appealId}</p>
          <p><strong>Application ID:</strong> ${applicationId}</p>
          <p>Our review team will respond within 5-7 working days.</p>
        </body>
        </html>
      `;
    }

    const mailOptions = {
      from: process.env.DEFAULT_FROM_EMAIL || `"Apravas Recruitment" <${process.env.SMTP_USER}>`,
      to: applicantEmail,
      subject: 'Appeal Submitted Successfully - Apravas Recruitment',
      html,
      text: `
        Appeal Submitted Successfully!
        
        Dear ${applicantName},
        
        Your appeal has been received and is under review.
        
        Appeal ID: ${appealId}
        Application ID: ${applicationId}
        
        Our review team will respond within 5-7 working days.
        
        Contact: ${templateData.recruitmentEmail} | ${templateData.recruitmentPhone}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Appeal confirmation email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Appeal confirmation email sent successfully',
    };
  } catch (error) {
    console.error('❌ Error sending appeal confirmation email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send appeal confirmation email',
    };
  }
};

module.exports = {
  initializeEmailService,
  sendApplicationConfirmation,
  sendRejectionEmail,
  sendAppealConfirmation,
  sendTestEmail,
};
