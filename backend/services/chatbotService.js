/**
 * Apravas Consulting AI Chatbot Service
 * Production-grade visa assistance chatbot with RAG, intent classification, and entity extraction
 */

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
// API key should be set via environment variable: OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not set. Chatbot will not work without it.');
}
const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null;

// Configuration
const CONFIG = {
  MODEL: "gpt-4o-mini",
  TEMPERATURE: 0.3, // Lower for factual accuracy
  MAX_TOKENS: 1500,
  TOP_P: 1,
  FREQUENCY_PENALTY: 0,
  PRESENCE_PENALTY: 0,
  EMBEDDING_MODEL: "text-embedding-3-small",
  MAX_CONTEXT_DOCS: 3, // Number of documents to retrieve for context
};

// Load knowledge base
let knowledgeBase = null;

function loadKnowledgeBase() {
  try {
    const kbPath = path.join(__dirname, '../data/visa-knowledge-base-enhanced.json');
    if (fs.existsSync(kbPath)) {
      const data = fs.readFileSync(kbPath, 'utf8');
      knowledgeBase = JSON.parse(data);
      console.log(`✅ Enhanced knowledge base loaded: ${knowledgeBase.documents?.length || 0} documents`);
      return true;
    } else {
      console.warn('⚠️ Enhanced knowledge base not found, using basic knowledge base');
      const basicKbPath = path.join(__dirname, '../data/visa-knowledge-base.json');
      if (fs.existsSync(basicKbPath)) {
        const data = fs.readFileSync(basicKbPath, 'utf8');
        knowledgeBase = JSON.parse(data);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return false;
  }
}

// Initialize knowledge base on module load
loadKnowledgeBase();

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

const activeSessions = new Map();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

class UserContext {
  constructor(userId, sessionId) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.name = null;
    this.targetCountry = null;
    this.visaType = null;
    this.educationLevel = null;
    this.workExperienceYears = null;
    this.languageScores = {};
    this.conversationHistory = [];
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  addMessage(role, content, metadata = {}) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    });
    // Keep only last 20 messages for context window
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
    this.lastActivity = new Date();
  }

  getRecentContext(n = 5) {
    const recent = this.conversationHistory.slice(-n);
    return recent.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  }
}

function createSession(userId, sessionId = null) {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  const context = new UserContext(userId, sessionId);
  activeSessions.set(sessionId, context);
  cleanupExpiredSessions();
  return context;
}

function getSession(sessionId) {
  cleanupExpiredSessions();
  return activeSessions.get(sessionId);
}

function updateSession(sessionId, updates) {
  const context = getSession(sessionId);
  if (context) {
    Object.assign(context, updates);
    context.lastActivity = new Date();
  }
  return context;
}

function cleanupExpiredSessions() {
  const now = new Date();
  for (const [sessionId, context] of activeSessions.entries()) {
    if (now - context.lastActivity > SESSION_TIMEOUT) {
      activeSessions.delete(sessionId);
    }
  }
}

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

const INTENT_PATTERNS = {
  greeting: [
    /\b(hi|hello|hey|good morning|good afternoon|good evening|namaste|greetings)\b/i,
  ],
  visa_info: [
    /\b(visa|permit|immigration)\b.*\b(info|information|details|about|process|requirements?|how)\b/i,
    /\b(work|student|business|tourist)\s+(visa|permit)\b/i,
  ],
  document_checklist: [
    /\b(document|paper|requirement|needed|checklist|papers?)\b/i,
    /\b(what\s+(documents?|papers?|papers?)\s+(do\s+i\s+)?need|required\s+documents?)\b/i,
  ],
  eligibility: [
    /\b(eligible|qualify|can i|criteria|requirement for|am i eligible)\b/i,
    /\b(do i qualify|can i apply|am i qualified)\b/i,
  ],
  fees: [
    /\b(cost|fee|price|charge|payment|how much|expense|expenses?)\b/i,
    /\b(visa\s+fee|application\s+fee|processing\s+fee)\b/i,
  ],
  processing_time: [
    /\b(processing time|how long|duration|wait time|timeframe|timeline)\b/i,
    /\b(how\s+long\s+(does|will|to)|when\s+will\s+i\s+get)\b/i,
  ],
  appointment: [
    /\b(appointment|book|schedule|consultation|meet|visit|booking)\b/i,
    /\b(i\s+want\s+to\s+(book|schedule|meet)|set\s+up\s+appointment)\b/i,
  ],
  status_check: [
    /\b(status|track|application status|where is|check status)\b/i,
    /\b(what\s+is\s+the\s+status|track\s+my\s+application)\b/i,
  ],
  complaint: [
    /\b(complaint|problem|issue|bad experience|unhappy|dissatisfied)\b/i,
  ],
  goodbye: [
    /\b(bye|goodbye|thank|thanks|done|finished|that's all|no more questions)\b/i,
  ],
};

function classifyIntent(message) {
  const msgLower = message.toLowerCase();
  const scores = {};

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        score += 1;
      }
    }
    if (score > 0) {
      scores[intent] = score;
    }
  }

  if (Object.keys(scores).length === 0) {
    return { intent: 'general_query', confidence: 0.5 };
  }

  const bestIntent = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );
  const confidence = Math.min(scores[bestIntent] / INTENT_PATTERNS[bestIntent].length, 1.0);

  return { intent: bestIntent, confidence };
}

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================

const COUNTRIES = [
  'canada', 'usa', 'united states', 'america', 'uk', 'united kingdom',
  'britain', 'australia', 'germany', 'ireland', 'new zealand',
  'singapore', 'uae', 'dubai', 'israel', 'india',
];

const VISA_TYPES = [
  'work', 'student', 'study', 'business', 'tourist', 'visitor',
  'pr', 'permanent residency', 'family', 'spouse', 'skilled worker',
  'construction', 'healthcare', 'caregiving',
];

function extractEntities(message) {
  const msgLower = message.toLowerCase();
  const entities = {};

  // Extract country
  for (const country of COUNTRIES) {
    if (msgLower.includes(country)) {
      entities.country = country.charAt(0).toUpperCase() + country.slice(1);
      if (country === 'usa' || country === 'united states' || country === 'america') {
        entities.country = 'USA';
      } else if (country === 'uk' || country === 'united kingdom' || country === 'britain') {
        entities.country = 'UK';
      }
      break;
    }
  }

  // Extract visa type
  for (const vtype of VISA_TYPES) {
    if (msgLower.includes(vtype)) {
      entities.visaType = vtype.charAt(0).toUpperCase() + vtype.slice(1);
      break;
    }
  }

  // Extract education level
  if (/\b(bachelor|b\.tech|b\.e\.|undergraduate|bsc|ba)\b/i.test(message)) {
    entities.education = "Bachelor's";
  } else if (/\b(master|m\.tech|m\.s\.|postgraduate|mba|msc|ma)\b/i.test(message)) {
    entities.education = "Master's";
  } else if (/\b(phd|doctorate|ph\.d|phd)\b/i.test(message)) {
    entities.education = "PhD";
  }

  // Extract experience
  const expMatch = message.match(/(\d+)\+?\s*(years?|yrs?)\s*(of\s+)?experience/i);
  if (expMatch) {
    entities.experienceYears = parseInt(expMatch[1]);
  }

  return entities;
}

// ============================================================================
// KNOWLEDGE BASE SEARCH (Semantic Search with Embeddings)
// ============================================================================

async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: CONFIG.EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchKnowledgeBase(query, country = null, visaType = null, topK = CONFIG.MAX_CONTEXT_DOCS) {
  if (!knowledgeBase || !knowledgeBase.documents) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  const results = [];

  // Helper: score one doc (used for main and fallback search)
  function scoreDoc(doc, qLower, useCountryFilter, useVisaFilter) {
    if (useCountryFilter && country && doc.country && doc.country.toLowerCase() !== country.toLowerCase()) {
      return 0;
    }
    if (useVisaFilter && visaType && doc.visa_type && doc.visa_type.toLowerCase() !== visaType.toLowerCase()) {
      return 0;
    }
    let score = 0;
    const titleLower = (doc.title || '').toLowerCase();
    const contentLower = (doc.content || '').toLowerCase();

    // Title match (full phrase or significant words)
    if (doc.title && titleLower.includes(qLower)) {
      score += 10;
    }

    // Content match: words longer than 2 chars
    const queryWords = qLower.split(/\s+/).filter(w => w.length > 2);
    for (const word of queryWords) {
      const count = (contentLower.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
      score += count * 2;
    }
    // Also match in title for each word
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 5;
    }

    // Boost for "visa process" / "what is the visa process" etc.
    if (qLower.includes('process') && (titleLower.includes('process') || contentLower.includes('process'))) {
      score += 15;
    }
    if (qLower.includes('visa type') || qLower.includes('types of visa') || qLower.includes('kinds of visa')) {
      if (contentLower.includes('visa type') || contentLower.includes('types') || titleLower.includes('overview') || titleLower.includes('types')) {
        score += 20;
      }
    }

    // Keyword match
    if (doc.keywords) {
      for (const keyword of doc.keywords) {
        const kw = keyword.toLowerCase();
        if (qLower.includes(kw) || kw.includes(qLower)) {
          score += 5;
        }
      }
    }

    return score;
  }

  for (const doc of knowledgeBase.documents) {
    const score = scoreDoc(doc, queryLower, true, true);
    if (score > 0) {
      results.push({ doc, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  let out = results.slice(0, topK).map(r => r.doc);

  // Fallback: if no results and query is visa-related, retry with relaxed matching (no country/visa filter) and minimal query
  if (out.length === 0 && /visa|permit|immigration|work|study|student|process|requirement/i.test(queryLower)) {
    const fallbackQuery = queryLower.replace(/\b(what|is|the|how|does|do|can|i|a|an|for|in|to|of)\b/gi, '').trim() || 'visa';
    const fallbackResults = [];
    for (const doc of knowledgeBase.documents) {
      const score = scoreDoc(doc, fallbackQuery, false, false);
      if (score > 0) fallbackResults.push({ doc, score });
    }
    fallbackResults.sort((a, b) => b.score - a.score);
    out = fallbackResults.slice(0, topK).map(r => r.doc);
  }

  return out;
}

// ============================================================================
// RAG RESPONSE GENERATION
// ============================================================================

async function _getChatBotResponse(messages) {
  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: CONFIG.MODEL,
      temperature: CONFIG.TEMPERATURE,
      max_tokens: CONFIG.MAX_TOKENS,
      top_p: CONFIG.TOP_P,
      frequency_penalty: CONFIG.FREQUENCY_PENALTY,
      presence_penalty: CONFIG.PRESENCE_PENALTY,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    throw error;
  }
}

function buildSystemPrompt(context, relevantDocs, userMessage = '') {
  let prompt = `You are ApravasBot, the official AI assistant for Apravas Consulting, a professional visa and immigration consultancy.

CRITICAL INSTRUCTIONS:
1. **USE THE PROVIDED DOCUMENTS**: If official government information is provided below, you MUST use it to answer the user's question. Do not say you don't have information if documents are provided.
2. **When documents are provided**: Extract and present the relevant information from the documents. For questions about "visa types", list all visa types mentioned in the documents.
3. **When NO documents are provided**: Only then say: "I don't have specific information about that in my current knowledge base. Let me connect you with an Apravas counselor who can provide the latest updates."
4. Always cite the official source (government authority) for every piece of information.
5. Never provide legal advice. Always include disclaimer: "This information is for guidance only. Please consult with an Apravas immigration expert for personalized advice."
6. Be professional, empathetic, and concise.
7. If the user asks about fees, always mention that government fees change and they should verify current amounts on official websites.
8. For document checklists, be thorough and specify if originals or copies are needed.
9. If eligibility is complex, recommend a consultation rather than giving definitive yes/no answers.
10. **For "visa types" questions**: If documents are provided, list all visa types mentioned in those documents. Organize them clearly (e.g., Nonimmigrant vs Immigrant, or by category).

`;

  // Add user context
  if (context) {
    prompt += 'Current user context:\n';
    if (context.name) prompt += `- Name: ${context.name}\n`;
    if (context.targetCountry) prompt += `- Target Country: ${context.targetCountry}\n`;
    if (context.visaType) prompt += `- Visa Type: ${context.visaType}\n`;
    if (context.educationLevel) prompt += `- Education: ${context.educationLevel}\n`;
    if (context.workExperienceYears) prompt += `- Experience: ${context.workExperienceYears} years\n`;
  }

  // Add retrieved knowledge
  if (relevantDocs && relevantDocs.length > 0) {
    prompt += `\nIMPORTANT: You have ${relevantDocs.length} official government document(s) provided below. USE THIS INFORMATION to answer the user's question.\n\n`;
    prompt += 'Official Government Information:\n';
    for (const doc of relevantDocs) {
      prompt += `\n---\nSource: ${doc.source_authority || 'Official Source'} (${doc.country || 'N/A'})\n`;
      prompt += `Title: ${doc.title || 'N/A'}\n`;
      // Include more content for visa types queries
      const contentLength = userMessage && userMessage.toLowerCase().includes('visa type') ? 2000 : 1000;
      prompt += `Content: ${doc.content || ''}\n`;
      if (doc.source) prompt += `URL: ${doc.source}\n`;
      if (doc.last_verified) prompt += `Last Verified: ${doc.last_verified}\n`;
    }
    prompt += '\n---\nRemember: Use the information above to answer the user\'s question. Do not say you don\'t have information when documents are provided.\n';
  } else {
    prompt += '\nNOTE: No specific documents were found for this query. You may need to offer to connect the user with a counselor.\n';
  }

  return prompt;
}

async function generateResponse(userMessage, sessionId = null) {
  try {
    // Get or create session
    let context = sessionId ? getSession(sessionId) : null;
    if (!context) {
      context = createSession('guest', sessionId);
    }

    // Classify intent and extract entities
    const { intent, confidence: intentConfidence } = classifyIntent(userMessage);
    const entities = extractEntities(userMessage);

    // Update context with extracted entities
    if (entities.country) context.targetCountry = entities.country;
    if (entities.visaType) context.visaType = entities.visaType;
    if (entities.education) context.educationLevel = entities.education;
    if (entities.experienceYears) context.workExperienceYears = entities.experienceYears;

    // Search knowledge base
    const relevantDocs = await searchKnowledgeBase(
      userMessage,
      context.targetCountry,
      context.visaType,
      CONFIG.MAX_CONTEXT_DOCS
    );

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context, relevantDocs, userMessage);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent conversation history
    const recentHistory = context.conversationHistory.slice(-3);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    // Generate response
    const aiResponse = await _getChatBotResponse(messages);

    // Validate and enhance response
    let validatedResponse = validateResponse(aiResponse, relevantDocs);
    
    // Add source citations
    const sources = relevantDocs.map(doc => ({
      title: doc.title || 'N/A',
      url: doc.source || '',
      authority: doc.source_authority || 'Official Source',
      country: doc.country || '',
      lastVerified: doc.last_verified || '',
    }));

    // Calculate confidence
    let confidence = 'high';
    if (intentConfidence < 0.7) confidence = 'medium';
    if (!relevantDocs || relevantDocs.length === 0) confidence = 'medium';
    if (validatedResponse.includes("don't have specific information")) confidence = 'low';

    // Update context
    context.addMessage('user', userMessage);
    context.addMessage('assistant', validatedResponse, {
      intent,
      entities,
      sources: sources.map(s => s.url),
      confidence,
    });

    // Suggest actions
    const suggestedActions = suggestActions(context, userMessage, intent);

    return {
      response: validatedResponse,
      intent,
      entities,
      sources,
      confidence,
      suggestedActions,
      sessionId: context.sessionId,
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      response: "I apologize, but I'm experiencing technical difficulties. Please contact Apravas Consulting directly for immediate assistance.",
      intent: 'error',
      entities: {},
      sources: [],
      confidence: 'error',
      suggestedActions: ['contact_human'],
      sessionId: sessionId || null,
    };
  }
}

function validateResponse(response, sources) {
  let validated = response;

  // Ensure disclaimer is present
  if (!validated.includes('consult with an Apravas') && !validated.includes('immigration expert')) {
    validated += '\n\n*Disclaimer: This information is for guidance only. Please consult with an Apravas immigration expert for personalized advice.*';
  }

  // Check for source citations
  if (sources && sources.length > 0) {
    const hasCitation = sources.some(s => 
      validated.includes(s.authority) || validated.includes(s.country)
    );
    if (!hasCitation && sources[0]) {
      validated += `\n\n*Source: ${sources[0].source_authority || 'Official Government Source'}*`;
    }
  }

  // Replace uncertainty phrases
  validated = validated.replace(/I think/gi, 'According to official sources');
  validated = validated.replace(/probably/gi, 'typically');
  validated = validated.replace(/might be/gi, 'may be');
  validated = validated.replace(/I believe/gi, 'Based on official information');

  return validated;
}

function suggestActions(context, message, intent) {
  const actions = [];
  const msgLower = message.toLowerCase();

  if (msgLower.includes('document') || msgLower.includes('paper') || msgLower.includes('requirement')) {
    actions.push('download_checklist');
  }

  if (msgLower.includes('book') || msgLower.includes('appointment') || msgLower.includes('consultation') || intent === 'appointment') {
    actions.push('schedule_consultation');
  }

  if (context.targetCountry && context.visaType) {
    actions.push('check_eligibility');
  }

  if (msgLower.includes('cost') || msgLower.includes('fee') || msgLower.includes('price') || intent === 'fees') {
    actions.push('fee_calculator');
  }

  actions.push('speak_to_human');

  return actions.slice(0, 3); // Limit to top 3
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  generateResponse,
  createSession,
  getSession,
  updateSession,
  classifyIntent,
  extractEntities,
  searchKnowledgeBase,
  _getChatBotResponse,
  loadKnowledgeBase,
  // Export for status endpoint
  getActiveSessionsCount: () => activeSessions.size,
};


