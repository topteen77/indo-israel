const express = require('express');
const router = express.Router();
const { generateAdminDashboard, generateEmployerDashboard, generateWorkerDashboard } = require('../services/mockData');

// Middleware to extract user from token (simplified for demo)
const getUserFromToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.role;
  
  if (token?.includes('admin')) {
    req.user = { id: 'admin-1', role: 'admin' };
  } else if (token?.includes('employer')) {
    req.user = { id: 'employer-1', role: 'employer' };
  } else if (token?.includes('worker')) {
    req.user = { id: 'worker-1', role: 'worker' };
  } else {
    // Default to admin for demo
    req.user = { id: 'admin-1', role: 'admin' };
  }
  
  next();
};

// Apravas Admin Dashboard
router.get('/apravas', getUserFromToken, (req, res) => {
  const dateRange = req.query.range || '30d';
  const data = generateAdminDashboard(dateRange);
  res.json({ success: true, data });
});

// Israeli Employer Dashboard
router.get('/employer', getUserFromToken, (req, res) => {
  const data = generateEmployerDashboard(req.user.id);
  res.json({ success: true, data });
});

// Worker Dashboard
router.get('/worker', getUserFromToken, (req, res) => {
  const data = generateWorkerDashboard(req.user.id);
  res.json({ success: true, data });
});

module.exports = router;
