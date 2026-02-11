/**
 * Apravas Chatbot API Routes
 * Handles chatbot interactions with RAG, intent classification, and entity extraction.
 * Agent handoff: waiting sessions, join, and live chat with user.
 */

const express = require('express');
const router = express.Router();
const xss = require('xss');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const {
  generateResponse,
  createSession,
  getSession,
  updateSession,
  classifyIntent,
  extractEntities,
  searchKnowledgeBase,
} = require('../services/chatbotService');
const { logWebsiteError } = require('../utils/websiteErrorLogger');

// Admin auth for agent routes
const getAdminFromToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.query.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = db.prepare('SELECT id, role, fullName FROM users WHERE id = ?').get(decoded.id);
    req.user = user ? { id: user.id, role: user.role, fullName: user.fullName } : null;
  } catch (e) {
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

    // If an agent has joined this session, do not use AI: forward message to agent only. AI resumes when agent ends session.
    const handoff = sessionId ? db.prepare('SELECT id, status FROM agent_handoffs WHERE sessionId = ?').get(sessionId) : null;
    if (handoff && handoff.status === 'joined') {
      try {
        db.prepare('INSERT INTO agent_chat_messages (sessionId, role, content) VALUES (?, ?, ?)').run(sessionId, 'user', sanitizedMessage);
      } catch (e) {
        console.error('Persist user message for agent:', e.message);
      }
      const noAiMessage = "Your message has been sent to the support agent. They will reply here shortly.";
      return res.json({
        success: true,
        data: {
          response: noAiMessage,
          sessionId,
          intent: null,
          entities: {},
          sources: [],
          confidence: 'high',
          suggestedActions: [],
        },
      });
    }

    // Generate response with RAG (no active agent, or handoff not yet joined / already closed)
    const result = await generateResponse(sanitizedMessage, sessionId);

    // If handoff exists and was joined, we would have returned above; this path can still persist for any edge case
    try {
      const handoffAgain = db.prepare('SELECT id, status FROM agent_handoffs WHERE sessionId = ?').get(sessionId);
      if (handoffAgain && handoffAgain.status === 'joined') {
        db.prepare('INSERT INTO agent_chat_messages (sessionId, role, content) VALUES (?, ?, ?)').run(sessionId, 'user', sanitizedMessage);
        db.prepare('INSERT INTO agent_chat_messages (sessionId, role, content) VALUES (?, ?, ?)').run(sessionId, 'assistant', result.response || '');
      }
    } catch (e) {
      console.error('Persist message for agent:', e.message);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in chatbot message endpoint:', error);
    logWebsiteError('chatbot', error.message, error.stack);
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
 * Create handoff request: agent gets notification, can join and chat with this session.
 */
router.post('/handoff', (req, res) => {
  try {
    const { sessionId, reason, userName, userMobile, userEmail } = req.body;

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
    const name = userName != null ? String(userName).trim() : null;
    const mobile = userMobile != null ? String(userMobile).trim() : null;
    const email = userEmail != null ? String(userEmail).trim() : null;
    console.log('Handoff request', {
      confirmationCode,
      reason: reason || 'not_specified',
      messageCount: context.conversationHistory.length,
      hasContact: !!(name || mobile || email),
    });

    // Create handoff row so agents see "chat join" request (one per session)
    const existing = db.prepare('SELECT id FROM agent_handoffs WHERE sessionId = ?').get(sessionId);
    if (!existing) {
      db.prepare(
        'INSERT INTO agent_handoffs (sessionId, status, userName, userMobile, userEmail) VALUES (?, ?, ?, ?, ?)'
      ).run(sessionId, 'waiting', name || null, mobile || null, email || null);
      // Persist current conversation so agent can see it when they join
      const insertMsg = db.prepare('INSERT INTO agent_chat_messages (sessionId, role, content) VALUES (?, ?, ?)');
      for (const msg of context.conversationHistory || []) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        insertMsg.run(sessionId, role, msg.content || '');
      }
    } else {
      db.prepare(
        'UPDATE agent_handoffs SET status = ?, agentUserId = NULL, joinedAt = NULL, userName = ?, userMobile = ?, userEmail = ? WHERE sessionId = ?'
      ).run('waiting', name || null, mobile || null, email || null, sessionId);
    }

    // Notify recruitment team by email (include user info and link to Live chat tab)
    const { sendSpeakToHumanNotification } = require('../services/emailService');
    sendSpeakToHumanNotification(confirmationCode, sessionId, {
      userName: name,
      userMobile: mobile,
      userEmail: email,
    }).catch((err) => {
      console.error('Failed to send speak-to-human notification email:', err);
    });

    res.json({
      success: true,
      message: 'Handoff request created. An agent will join your chat shortly.',
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
 * GET /api/chatbot/agent/waiting-sessions
 * List sessions waiting for an agent (admin only). Agent gets "notification" of chat join requests.
 */
router.get('/agent/waiting-sessions', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT id, sessionId, status, agentUserId, createdAt, joinedAt, userName, userMobile, userEmail 
       FROM agent_handoffs 
       WHERE status = 'waiting' 
       ORDER BY createdAt DESC`
    ).all();
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('Agent waiting-sessions:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/chatbot/agent/join/:sessionId
 * Agent joins this session and will see the chat (admin only).
 */
router.post('/agent/join/:sessionId', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const { sessionId } = req.params;
    const agentUserId = req.user?.id;
    const agentName = (req.user?.fullName || 'Agent').trim() || 'Agent';
    const handoff = db.prepare('SELECT id FROM agent_handoffs WHERE sessionId = ?').get(sessionId);
    if (!handoff) {
      return res.status(404).json({ success: false, message: 'Session not found or not waiting' });
    }
    db.prepare(
      'UPDATE agent_handoffs SET status = ?, agentUserId = ?, joinedAt = CURRENT_TIMESTAMP WHERE sessionId = ?'
    ).run('joined', agentUserId, sessionId);
    db.prepare(
      "INSERT INTO agent_chat_messages (sessionId, role, content) VALUES (?, 'system', ?)"
    ).run(sessionId, `Agent: ${agentName} joined`);
    res.json({ success: true, data: { sessionId, status: 'joined' } });
  } catch (e) {
    console.error('Agent join:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /api/chatbot/agent/session/:sessionId
 * Get full conversation for this session (admin only). Agent sees user + assistant + agent messages.
 */
router.get('/agent/session/:sessionId', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = db.prepare(
      'SELECT id, sessionId, role, content, createdAt FROM agent_chat_messages WHERE sessionId = ? ORDER BY id ASC'
    ).all(sessionId);
    const handoff = db.prepare('SELECT status, agentUserId, joinedAt FROM agent_handoffs WHERE sessionId = ?').get(sessionId);
    res.json({ success: true, data: { sessionId, messages, handoff: handoff || null } });
  } catch (e) {
    console.error('Agent session:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/chatbot/agent/session/:sessionId/message
 * Agent sends a message to the user in this session (admin only). User will see it via polling.
 */
router.post('/agent/session/:sessionId/message', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const { sessionId } = req.params;
    const content = (req.body?.content || req.body?.message || '').trim();
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    const handoff = db.prepare('SELECT id, status FROM agent_handoffs WHERE sessionId = ?').get(sessionId);
    if (!handoff) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (handoff.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Session is closed' });
    }
    const run = db.prepare('INSERT INTO agent_chat_messages (sessionId, role, content) VALUES (?, ?, ?)').run(sessionId, 'agent', content);
    res.json({ success: true, data: { id: run.lastInsertRowid, role: 'agent', content, sessionId } });
  } catch (e) {
    console.error('Agent message:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/chatbot/agent/session/:sessionId/close
 * Agent ends the live chat. User will see a system message when they poll.
 */
router.post('/agent/session/:sessionId/close', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const { sessionId } = req.params;
    const handoff = db.prepare('SELECT id FROM agent_handoffs WHERE sessionId = ?').get(sessionId);
    if (!handoff) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    db.prepare("UPDATE agent_handoffs SET status = 'closed' WHERE sessionId = ?").run(sessionId);
    db.prepare(
      "INSERT INTO agent_chat_messages (sessionId, role, content) VALUES (?, 'system', ?)"
    ).run(sessionId, 'Chat ended by agent.');
    res.json({ success: true, data: { sessionId, status: 'closed' } });
  } catch (e) {
    console.error('Agent close session:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/chatbot/session/:sessionId/close
 * User ends the live chat. Agent will see a system message on next poll.
 */
router.post('/session/:sessionId/close', (req, res) => {
  try {
    const { sessionId } = req.params;
    const handoff = db.prepare('SELECT id FROM agent_handoffs WHERE sessionId = ?').get(sessionId);
    if (!handoff) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    db.prepare("UPDATE agent_handoffs SET status = 'closed' WHERE sessionId = ?").run(sessionId);
    db.prepare(
      "INSERT INTO agent_chat_messages (sessionId, role, content) VALUES (?, 'system', ?)"
    ).run(sessionId, 'Chat ended by user.');
    res.json({ success: true, data: { sessionId, status: 'closed' } });
  } catch (e) {
    console.error('User close session:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /api/chatbot/session/:sessionId/updates?after=id
 * User polls for new messages (e.g. agent messages). Returns messages with id > after.
 */
router.get('/session/:sessionId/updates', (req, res) => {
  try {
    const { sessionId } = req.params;
    const after = parseInt(req.query.after, 10) || 0;
    const messages = db.prepare(
      'SELECT id, role, content, createdAt FROM agent_chat_messages WHERE sessionId = ? AND id > ? ORDER BY id ASC'
    ).all(sessionId, after);
    res.json({ success: true, data: { messages } });
  } catch (e) {
    console.error('Session updates:', e);
    res.status(500).json({ success: false, message: e.message });
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
