const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboards');
const analyticsRoutes = require('./routes/analytics');
const safetyRoutes = require('./routes/safety');
const jobsRoutes = require('./routes/jobs');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/jobs', jobsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Apravas API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Accessible from network at http://<your-ip>:${PORT}`);
});
