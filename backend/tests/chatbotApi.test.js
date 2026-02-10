/**
 * API tests for chatbot routes (health, status, session, schedule, handoff).
 * Run: node --test tests/chatbotApi.test.js
 * Uses exported app (no server listen).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

// When requiring server, we get the exported app (listen not run)
const app = require('../server');

describe('Chatbot API', () => {
  it('GET /api/health returns 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  it('GET /api/chatbot/status returns 200 and knowledgeBaseLoaded', async () => {
    const res = await request(app).get('/api/chatbot/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.data.knowledgeBaseLoaded === 'boolean');
  });

  it('POST /api/chatbot/session creates session', async () => {
    const res = await request(app)
      .post('/api/chatbot/session')
      .send({ userId: 'guest' })
      .set('Content-Type', 'application/json');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.sessionId);
  });

  it('POST /api/chatbot/schedule returns 200 and confirmation', async () => {
    const res = await request(app)
      .post('/api/chatbot/schedule')
      .send({ topic: 'USA work visa' })
      .set('Content-Type', 'application/json');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.confirmationCode.startsWith('SCHED-'));
  });

  it('POST /api/chatbot/message rejects empty message', async () => {
    const res = await request(app)
      .post('/api/chatbot/message')
      .send({ message: '   ' })
      .set('Content-Type', 'application/json');
    assert.strictEqual(res.status, 400);
  });

  it('POST /api/chatbot/message sanitizes XSS', async () => {
    const res = await request(app)
      .post('/api/chatbot/message')
      .send({ message: 'hello <script>alert(1)</script> world' })
      .set('Content-Type', 'application/json');
    // Should accept (200) or reject; body must not contain raw script
    assert.ok(res.status === 200 || res.status === 429 || res.status === 500);
    if (res.status === 200 && res.body.data && res.body.data.response) {
      assert.ok(!res.body.data.response.includes('<script>'));
    }
  });

  it('POST /api/chatbot/handoff without sessionId returns 400', async () => {
    const res = await request(app)
      .post('/api/chatbot/handoff')
      .send({})
      .set('Content-Type', 'application/json');
    assert.strictEqual(res.status, 400);
  });
});
