const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const router = express.Router();
const { generateAdminDashboard } = require('../services/mockData');
const { getWorkerDashboard } = require('../services/workerDashboardService');
const { getEmployerDashboard } = require('../services/employerDashboardService');

// Middleware: resolve user from JWT or fallback to demo token
const getUserFromToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.query.token || req.query.role;

  if (token && !token.includes('admin') && !token.includes('employer') && !token.includes('worker')) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(decoded.id);
      if (user) {
        req.user = { id: user.id, role: user.role };
        return next();
      }
    } catch (e) {
      // Not a valid JWT, fall through to demo logic
    }
  }

  if (token?.includes('admin')) {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'admin' LIMIT 1").get();
    req.user = user ? { id: user.id, role: 'admin' } : { id: 'admin-1', role: 'admin' };
  } else if (token?.includes('employer')) {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'employer' LIMIT 1").get();
    req.user = user ? { id: user.id, role: 'employer' } : { id: 'employer-1', role: 'employer' };
  } else if (token?.includes('worker')) {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'worker' LIMIT 1").get();
    req.user = user ? { id: user.id, role: 'worker' } : { id: 'worker-1', role: 'worker' };
  } else {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'admin' LIMIT 1").get();
    req.user = user ? { id: user.id, role: user.role } : { id: 'admin-1', role: 'admin' };
  }
  next();
};

// Apravas Admin Dashboard
router.get('/apravas', getUserFromToken, (req, res) => {
  const dateRange = req.query.range || '30d';
  const data = generateAdminDashboard(dateRange);
  res.json({ success: true, data });
});

// Israeli Employer Dashboard (dynamic from DB)
router.get('/employer', getUserFromToken, (req, res) => {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ success: false, message: 'Employer dashboard requires employer role' });
  }
  const data = getEmployerDashboard(req.user.id);
  res.json({ success: true, data });
});

// Worker Dashboard (dynamic from DB)
router.get('/worker', getUserFromToken, (req, res) => {
  if (req.user.role !== 'worker') {
    return res.status(403).json({ success: false, message: 'Worker dashboard requires worker role' });
  }
  const data = getWorkerDashboard(req.user.id);
  res.json({ success: true, data });
});

module.exports = router;
