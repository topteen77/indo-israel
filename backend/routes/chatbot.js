/**
 * Apravas Chatbot API Routes
 * Handles chatbot interactions with RAG, intent classification, and entity extraction
 */

const express = require('express');
const router = express.Router();
const xss = require('xss');
const {
  generateResponse,
  createSession,
  getSession,
  updateSession,
  classifyIntent,
  extractEntities,
  searchKnowledgeBase,
} = require('../services/chatbotService');

/**
 * Sanitize user message for XSS: strip HTML/scripts, limit length.
 */
function sanitizeMessage(input) {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  const sanitized = xss(trimmed, { stripIgnoreTagBody: ['script', 'style'], whiteList: {} });
  return sanitized.substring(0, 1000);
}

/**
 * POST /api/chatbot/message
 * Process chatbot message with RAG
 */
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId, userId = 'guest', metadata = {} } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string',
      });
    }

    const sanitizedMessage = sanitizeMessage(message);
    if (!sanitizedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string',
      });
    }

    // Generate response with RAG
    const result = await generateResponse(sanitizedMessage, sessionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in chatbot message endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chatbot message',
      error: error.message,
    });
  }
});

/**
 * GET /api/chatbot/session/:sessionId
 * Get conversation history for a session
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const context = getSession(sessionId);

    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: context.sessionId,
        userId: context.userId,
        conversationHistory: context.conversationHistory,
        profile: {
          name: context.name,
          targetCountry: context.targetCountry,
          visaType: context.visaType,
          educationLevel: context.educationLevel,
          workExperienceYears: context.workExperienceYears,
        },
        createdAt: context.createdAt,
        lastActivity: context.lastActivity,
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session',
      error: error.message,
    });
  }
});

/**
 * POST /api/chatbot/session
 * Create a new session
 */
router.post('/session', (req, res) => {
  try {
    const { userId = 'guest', sessionId } = req.body;
    const context = createSession(userId, sessionId);

    res.json({
      success: true,
      data: {
        sessionId: context.sessionId,
        userId: context.userId,
        createdAt: context.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message,
    });
  }
});

/**
 * PUT /api/chatbot/profile/:sessionId
 * Update user profile
 */
router.put('/profile/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;

    const context = updateSession(sessionId, updates);

    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: context.sessionId,
        profile: {
          name: context.name,
          targetCountry: context.targetCountry,
          visaType: context.visaType,
          educationLevel: context.educationLevel,
          workExperienceYears: context.workExperienceYears,
        },
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

/**
 * GET /api/chatbot/documents/:country/:visaType
 * Get document checklist for specific country and visa type
 */
router.get('/documents/:country/:visaType', async (req, res) => {
  try {
    const { country, visaType } = req.params;
    const docs = await searchKnowledgeBase(
      'document requirements checklist',
      country,
      visaType,
      1
    );

    if (!docs || docs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document checklist not found for this combination',
      });
    }

    const doc = docs[0];
    res.json({
      success: true,
      data: {
        country,
        visaType,
        title: doc.title,
        content: doc.content,
        checklist: extractChecklistItems(doc.content),
        source: doc.source,
        authority: doc.source_authority,
        lastVerified: doc.last_verified,
      },
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document checklist',
      error: error.message,
    });
  }
});

/**
 * POST /api/chatbot/schedule
 * Request a consultation booking (CRM integration hook).
 * Body: { sessionId?, preferredDate?, preferredTime?, topic?, country?, visaType?, contactPreference? }
 */
router.post('/schedule', (req, res) => {
  try {
    const { sessionId, preferredDate, preferredTime, topic, country, visaType, contactPreference } = req.body;

    const confirmationCode = `SCHED-${Date.now().toString(36).toUpperCase()}`;
    // CRM integration: in production, create calendar event / CRM lead here (no PII in logs).
    console.log('Consultation request', {
      confirmationCode,
      hasSession: !!sessionId,
      topic: topic || null,
      country: country || null,
      visaType: visaType || null,
    });

    res.json({
      success: true,
      message: 'Your consultation request has been received. An Apravas counselor will contact you to confirm the appointment.',
      data: {
        confirmationCode,
        estimatedResponseTime: '24 hours',
      },
    });
  } catch (error) {
    console.error('Error in schedule endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit consultation request',
      error: error.message,
    });
  }
});

/**
 * POST /api/chatbot/handoff
 * Create handoff request for human counselor (no PII in logs).
 */
router.post('/handoff', (req, res) => {
  try {
    const { sessionId, reason } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    const context = getSession(sessionId);
    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const confirmationCode = `HANDOFF-${Date.now().toString(36).toUpperCase()}`;
    // Log only non-PII: session id, reason, message count (GDPR-compliant).
    console.log('Handoff request', {
      confirmationCode,
      reason: reason || 'not_specified',
      messageCount: context.conversationHistory.length,
    });

    // Notify recruitment team by email (sender: default_from_email, recipient: recruitment_email)
    const { sendSpeakToHumanNotification } = require('../services/emailService');
    sendSpeakToHumanNotification(confirmationCode, sessionId).catch((err) => {
      console.error('Failed to send speak-to-human notification email:', err);
    });

    res.json({
      success: true,
      message: 'Handoff request created. Apravas counselor will contact you shortly.',
      data: {
        sessionId,
        confirmationCode,
        estimatedWaitTime: '24 hours',
      },
    });
  } catch (error) {
    console.error('Error creating handoff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create handoff request',
      error: error.message,
    });
  }
});

/**
 * GET /api/chatbot/status
 * Get chatbot service status
 */
router.get('/status', (req, res) => {
  try {
    const { loadKnowledgeBase } = require('../services/chatbotService');
    const kbLoaded = loadKnowledgeBase();

    res.json({
      success: true,
      data: {
        available: true,
        aiEnabled: true,
        model: 'gpt-4o-mini',
        features: {
          rag: true,
          intentClassification: true,
          entityExtraction: true,
          sourceCitations: true,
          confidenceScoring: true,
          multiCountry: true,
          multiVisaType: true,
          sessionManagement: true,
          profileManagement: true,
        },
        knowledgeBaseLoaded: kbLoaded,
        activeSessions: require('../services/chatbotService').getSession ? 
          'N/A (use internal method)' : 'Available',
      },
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message,
    });
  }
});

/**
 * Helper function to extract checklist items from content
 */
function extractChecklistItems(content) {
  const items = [];
  const lines = content.split('\n');
  let currentCategory = 'General';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect category headers
    if (trimmed.endsWith(':') && !trimmed.match(/^\d+\./)) {
      currentCategory = trimmed.slice(0, -1);
      continue;
    }

    // Extract numbered items
    const match = trimmed.match(/^\d+\.\s*(.+)/);
    if (match) {
      items.push({
        category: currentCategory,
        item: match[1],
        required: true,
        notes: '',
      });
    }
  }

  return items;
}

module.exports = router;
