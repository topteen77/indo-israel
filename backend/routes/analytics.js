const express = require('express');
const router = express.Router();
const { generateAdminDashboard, generateEmployerDashboard, generateWorkerDashboard } = require('../services/mockData');

const getUserFromToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.role;
  
  if (token?.includes('admin')) {
    req.user = { id: 'admin-1', role: 'admin' };
  } else if (token?.includes('employer')) {
    req.user = { id: 'employer-1', role: 'employer' };
  } else if (token?.includes('worker')) {
    req.user = { id: 'worker-1', role: 'worker' };
  } else {
    req.user = { id: 'admin-1', role: 'admin' };
  }
  
  next();
};

// Executive Summary
router.get('/executive-summary', getUserFromToken, (req, res) => {
  const dateRange = req.query.range || '30d';
  const data = generateAdminDashboard(dateRange);
  res.json({ success: true, data: data.summary });
});

// Pipeline Analytics
router.get('/pipeline', getUserFromToken, (req, res) => {
  const dateRange = req.query.range || '30d';
  const data = generateAdminDashboard(dateRange);
  res.json({ success: true, data: data.pipeline });
});

// Financial Analytics
router.get('/financial', getUserFromToken, (req, res) => {
  const dateRange = req.query.range || '30d';
  const data = generateAdminDashboard(dateRange);
  res.json({ success: true, data: data.financial });
});

// Predictive Insights
router.get('/predictive', getUserFromToken, (req, res) => {
  const data = generateAdminDashboard('30d');
  res.json({ success: true, data: data.predictive });
});

// Real-time Metrics
router.get('/realtime', getUserFromToken, (req, res) => {
  const data = generateAdminDashboard('30d');
  res.json({ success: true, data: data.realtime });
});

module.exports = router;
