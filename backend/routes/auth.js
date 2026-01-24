const express = require('express');
const router = express.Router();

// Mock users for demo
const mockUsers = {
  admin: {
    id: 'admin-1',
    email: 'admin@apravas.com',
    role: 'admin',
    name: 'Apravas Admin'
  },
  employer: {
    id: 'employer-1',
    email: 'employer@israel.com',
    role: 'employer',
    name: 'Israeli Employer',
    companyName: 'Tech Solutions Israel'
  },
  worker: {
    id: 'worker-1',
    email: 'worker@india.com',
    role: 'worker',
    name: 'Rajesh Kumar',
    fullName: 'Rajesh Kumar'
  }
};

// Simple login (no real auth for demo)
router.post('/login', (req, res) => {
  const { email, role } = req.body;
  
  let user = null;
  
  if (role === 'admin' || email.includes('admin')) {
    user = mockUsers.admin;
  } else if (role === 'employer' || email.includes('employer')) {
    user = mockUsers.employer;
  } else if (role === 'worker' || email.includes('worker')) {
    user = mockUsers.worker;
  }
  
  if (user) {
    res.json({
      success: true,
      user: user,
      token: `mock-token-${user.id}`
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token?.includes('admin')) {
    res.json({ success: true, user: mockUsers.admin });
  } else if (token?.includes('employer')) {
    res.json({ success: true, user: mockUsers.employer });
  } else if (token?.includes('worker')) {
    res.json({ success: true, user: mockUsers.worker });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

module.exports = router;
