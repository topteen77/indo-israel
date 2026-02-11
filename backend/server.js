const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load .env from project root (parent of backend) so root .env is used when running from backend/
const pathToRootEnv = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: pathToRootEnv });

const db = require('./database/db');
const getSetting = db.getSetting || (() => null);

// Initialize email service (SES/SMTP) after env is loaded; admin settings override .env
const { initializeEmailService } = require('./services/emailService');
initializeEmailService();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: admin setting cors_origins (or .env CORS_ORIGINS) – read per request so changes apply without restart
const corsOptions = {
  origin: (origin, callback) => {
    const corsOrigins = getSetting('cors_origins') || process.env.CORS_ORIGINS;
    const allowed = corsOrigins
      ? corsOrigins.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    if (allowed.length === 0) {
      return callback(null, true);
    }
    if (!origin) {
      return callback(null, true);
    }
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    try {
      const reqHost = new URL(origin).hostname;
      const sameHostAllowed = allowed.some(allowedUrl => new URL(allowedUrl).hostname === reqHost);
      if (sameHostAllowed) return callback(null, true);
    } catch (e) {}
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Chatbot rate limit: admin settings (chatbot_rate_limit_max, chatbot_rate_limit_window) or .env
const chatbotRateLimitWindow = parseInt(getSetting('chatbot_rate_limit_window') || process.env.CHATBOT_RATE_LIMIT_WINDOW_MS || process.env.CHATBOT_RATE_LIMIT_WINDOW || '3600000', 10);
const chatbotRateLimitMax = parseInt(getSetting('chatbot_rate_limit_max') || process.env.CHATBOT_RATE_LIMIT_MAX || '300', 10);
const chatbotLimiter = rateLimit({
  windowMs: chatbotRateLimitWindow,
  max: chatbotRateLimitMax,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    try {
      const { logWebsiteError } = require('./utils/websiteErrorLogger');
      logWebsiteError('rate_limit', 'Chatbot rate limit exceeded', `IP: ${req.ip || req.socket?.remoteAddress}`);
    } catch (e) {
      console.error('Website error log:', e.message);
    }
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboards');
const analyticsRoutes = require('./routes/analytics');
const safetyRoutes = require('./routes/safety');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const interviewsRoutes = require('./routes/interviews');
const crmRoutes = require('./routes/crm');
const googleSheetsRoutes = require('./routes/googleSheets');
const merfRoutes = require('./routes/merf');
const aiJobGeneratorRoutes = require('./routes/aiJobGenerator');
const chatbotRoutes = require('./routes/chatbot');
const emailRoutes = require('./routes/email');
const adminSettingsRoutes = require('./routes/adminSettings');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/google-sheets', googleSheetsRoutes);
app.use('/api/merf', merfRoutes);
app.use('/api/ai-job-generator', aiJobGeneratorRoutes);
app.use('/api/chatbot', chatbotLimiter, chatbotRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminSettingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Apravas API is running' });
});

// Export for testing (supertest)
module.exports = app;

// Start server when run directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Accessible from network at http://<your-ip>:${PORT}`);
  });
}
