const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load .env from project root (parent of backend) so root .env is used when running from backend/
const pathToRootEnv = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: pathToRootEnv });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: restrict to Apravas domains when CORS_ORIGINS is set (comma-separated); otherwise allow all for dev
const corsOrigins = process.env.CORS_ORIGINS;
const corsOptions = {
  origin: corsOrigins ? corsOrigins.split(',').map(s => s.trim()).filter(Boolean) : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Chatbot rate limit: 100 requests per hour per IP (configurable via env)
const chatbotRateLimitWindow = parseInt(process.env.CHATBOT_RATE_LIMIT_WINDOW_MS || '3600000', 10);
const chatbotRateLimitMax = parseInt(process.env.CHATBOT_RATE_LIMIT_MAX || '100', 10);
const chatbotLimiter = rateLimit({
  windowMs: chatbotRateLimitWindow,
  max: chatbotRateLimitMax,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
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
