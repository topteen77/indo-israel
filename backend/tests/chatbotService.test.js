/**
 * Automated tests for Apravas chatbot service (intent, entities, search).
 * Run: node --test tests/chatbotService.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  classifyIntent,
  extractEntities,
  searchKnowledgeBase,
  createSession,
  getSession,
  loadKnowledgeBase,
} = require('../services/chatbotService');

describe('chatbotService', () => {
  describe('classifyIntent', () => {
    it('classifies greeting', () => {
      const r = classifyIntent('Hello there');
      assert.strictEqual(r.intent, 'greeting');
      assert.ok(r.confidence >= 0 && r.confidence <= 1);
    });
    it('classifies visa_info', () => {
      const r = classifyIntent('What is the visa process for USA?');
      assert.strictEqual(r.intent, 'visa_info');
    });
    it('classifies document_checklist', () => {
      const r = classifyIntent('What documents do I need?');
      assert.strictEqual(r.intent, 'document_checklist');
    });
    it('classifies fees', () => {
      const r = classifyIntent('How much does the visa cost?');
      assert.strictEqual(r.intent, 'fees');
    });
    it('returns general_query for unknown', () => {
      const r = classifyIntent('xyz random text');
      assert.strictEqual(r.intent, 'general_query');
    });
  });

  describe('extractEntities', () => {
    it('extracts country USA', () => {
      const e = extractEntities('visa types for usa');
      assert.strictEqual(e.country, 'USA');
    });
    it('extracts country Israel', () => {
      const e = extractEntities('work visa in Israel');
      assert.strictEqual(e.country, 'Israel');
    });
    it('extracts visa type', () => {
      const e = extractEntities('student visa requirements');
      assert.strictEqual(e.visaType, 'Student');
    });
    it('extracts education', () => {
      const e = extractEntities('I have a master degree');
      assert.strictEqual(e.education, "Master's");
    });
  });

  describe('searchKnowledgeBase', () => {
    it('loads knowledge base', () => {
      const loaded = loadKnowledgeBase();
      assert.strictEqual(loaded, true);
    });
    it('returns array', async () => {
      const docs = await searchKnowledgeBase('visa', null, null, 3);
      assert.ok(Array.isArray(docs));
    });
    it('returns docs for usa visa types', async () => {
      const docs = await searchKnowledgeBase('visa types for usa', 'USA', null, 3);
      assert.ok(Array.isArray(docs));
      assert.ok(docs.length >= 1);
      assert.ok(docs[0].country === 'USA' || docs[0].title);
    });
    it('returns docs for visa process (fallback)', async () => {
      const docs = await searchKnowledgeBase('What is the visa process?', null, null, 3);
      assert.ok(Array.isArray(docs));
      assert.ok(docs.length >= 1, 'fallback should return at least one doc for visa-related query');
    });
  });

  describe('session', () => {
    it('createSession returns context with sessionId', () => {
      const ctx = createSession('guest');
      assert.ok(ctx.sessionId);
      assert.strictEqual(ctx.userId, 'guest');
    });
    it('getSession returns same context', () => {
      const ctx = createSession('guest');
      const found = getSession(ctx.sessionId);
      assert.strictEqual(found.sessionId, ctx.sessionId);
    });
  });
});
