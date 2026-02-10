const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/db');

/**
 * GET /api/auth/login-credentials (public)
 * Returns nav login label and only demo account credentials from DB (users with is_demo_account=1).
 */
router.get('/login-credentials', (req, res) => {
  try {
    const navLoginLabel = db.getSetting('nav_login_label') || 'Login';
    const showDemoCredentials = db.getSetting('show_demo_credentials') !== 'false';
    let credentials = [];
    try {
      const demoUsers = db.prepare(
        'SELECT email, demo_password, fullName, name, role FROM users WHERE is_demo_account = 1 ORDER BY role, id'
      ).all();
      demoUsers.forEach((u) => {
        const hasPassword = u.demo_password != null && String(u.demo_password).trim() !== '';
        credentials.push({
          email: u.email,
          password: hasPassword ? u.demo_password : null,
          name: u.fullName || u.name || u.email,
          role: u.role,
          description: '',
          demoOnly: !hasPassword,
        });
      });
    } catch (e) {
      // columns may not exist yet
    }
    res.json({ success: true, navLoginLabel, credentials, showDemoCredentials });
  } catch (e) {
    console.error('Get login credentials error:', e);
    res.status(500).json({ success: false, message: 'Failed to load', navLoginLabel: 'Login', credentials: [], showDemoCredentials: true });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, role } = req.body;
    
    // Find user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      // If user doesn't exist and role is provided, create a demo user
      if (role) {
        const roleMap = {
          'admin': { name: 'Apravas Admin', fullName: 'Apravas Admin', companyName: null },
          'employer': { name: 'Israeli Employer', fullName: 'David Cohen', companyName: 'Tech Solutions Israel' },
          'worker': { name: 'Rajesh Kumar', fullName: 'Rajesh Kumar', companyName: null }
        };
        
        const userData = roleMap[role] || roleMap['worker'];
        const password = bcrypt.hashSync('demo123', 10);
        
        const insertUser = db.prepare(`
          INSERT INTO users (email, password, name, fullName, role, companyName)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertUser.run(
          email,
          password,
          userData.name,
          userData.fullName,
          role,
          userData.companyName
        );
        
        const newUser = db.prepare('SELECT id, email, name, fullName, role, companyName FROM users WHERE id = ?').get(result.lastInsertRowid);
        
        const token = jwt.sign(
          { id: newUser.id, email: newUser.email, role: newUser.role },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );
        
        return res.json({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            fullName: newUser.fullName,
            role: newUser.role,
            companyName: newUser.companyName
          },
          token
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Require password: normal bcrypt or, for demo accounts, demo_password (so Login as can populate form and login)
    const password = req.body.password;
    if (!password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    let valid = bcrypt.compareSync(password, user.password);
    if (!valid && user.is_demo_account === 1 && user.demo_password) {
      valid = password === user.demo_password;
    }
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        fullName: user.fullName,
        role: user.role,
        companyName: user.companyName
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/login-as-demo (public)
 * One-click login for demo accounts (no password). Only users with is_demo_account=1 are allowed.
 */
router.post('/login-as-demo', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    const user = db.prepare('SELECT id, email, name, fullName, role, companyName, is_demo_account FROM users WHERE email = ?').get(email.trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (user.is_demo_account !== 1) {
      return res.status(403).json({ success: false, message: 'Not a demo account' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        fullName: user.fullName,
        role: user.role,
        companyName: user.companyName,
      },
      token,
    });
  } catch (e) {
    console.error('Login-as-demo error:', e);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = db.prepare('SELECT id, email, name, fullName, role, companyName, phone, address FROM users WHERE id = ?').get(decoded.id);
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      res.json({ success: true, user });
    } catch (jwtError) {
      // For backward compatibility with mock tokens
      if (token.includes('admin')) {
        const user = db.prepare("SELECT id, email, name, fullName, role, companyName, phone, address FROM users WHERE role = 'admin' LIMIT 1").get();
        if (user) return res.json({ success: true, user });
      } else if (token.includes('employer')) {
        const user = db.prepare("SELECT id, email, name, fullName, role, companyName, phone, address FROM users WHERE role = 'employer' LIMIT 1").get();
        if (user) return res.json({ success: true, user });
      } else if (token.includes('worker')) {
        const user = db.prepare("SELECT id, email, name, fullName, role, companyName, phone, address FROM users WHERE role = 'worker' LIMIT 1").get();
        if (user) return res.json({ success: true, user });
      }
      
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// Update user profile
router.put('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userId = decoded.id;
    } catch (jwtError) {
      // For backward compatibility with mock tokens
      if (token.includes('admin')) {
        const user = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
        if (user) userId = user.id;
      } else if (token.includes('employer')) {
        const user = db.prepare("SELECT id FROM users WHERE role = 'employer' LIMIT 1").get();
        if (user) userId = user.id;
      } else if (token.includes('worker')) {
        const user = db.prepare("SELECT id FROM users WHERE role = 'worker' LIMIT 1").get();
        if (user) userId = user.id;
      }
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }
    
    const { fullName, email, phone, address, dateOfBirth, gender, maritalStatus } = req.body;
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    
    if (fullName !== undefined) {
      updates.push('fullName = ?');
      values.push(fullName);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(userId);
    
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...values);
    
    // Get updated user
    const updatedUser = db.prepare('SELECT id, email, name, fullName, role, companyName, phone, address FROM users WHERE id = ?').get(userId);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Get worker application profile (for form pre-fill: passport, documents, etc.)
router.get('/worker-profile', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userId = decoded.id;
    } catch (e) {
      if (token.includes('worker')) {
        const u = db.prepare("SELECT id FROM users WHERE role = 'worker' LIMIT 1").get();
        if (u) userId = u.id;
      }
      if (!userId) return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    const row = db.prepare('SELECT profileData FROM worker_profiles WHERE userId = ?').get(userId);
    const profileData = row?.profileData ? JSON.parse(row.profileData) : {};
    res.json({ success: true, profile: profileData });
  } catch (err) {
    console.error('Get worker profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

// Update worker application profile (save application data for pre-fill)
router.put('/worker-profile', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userId = decoded.id;
    } catch (e) {
      if (token.includes('worker')) {
        const u = db.prepare("SELECT id FROM users WHERE role = 'worker' LIMIT 1").get();
        if (u) userId = u.id;
      }
      if (!userId) return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    // Merge with existing profileData so partial updates (like emergency contact) don't wipe prior fields
    const incoming = typeof req.body === 'object'
      ? req.body
      : (req.body.profileData ? JSON.parse(req.body.profileData) : {});

    let existing = {};
    try {
      const row = db.prepare('SELECT profileData FROM worker_profiles WHERE userId = ?').get(userId);
      existing = row?.profileData ? JSON.parse(row.profileData) : {};
    } catch (_) {
      existing = {};
    }

    const merged = { ...(existing || {}), ...(incoming || {}) };
    const json = JSON.stringify(merged);
    db.prepare(`
      INSERT INTO worker_profiles (userId, profileData, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET profileData = excluded.profileData, updatedAt = CURRENT_TIMESTAMP
    `).run(userId, json);
    res.json({ success: true, message: 'Profile saved' });
  } catch (err) {
    console.error('Update worker profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to save profile' });
  }
});

// Register new user (optional)
router.post('/register', (req, res) => {
  try {
    const { email, password, name, fullName, role, companyName } = req.body;
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Insert user
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, name, fullName, role, companyName)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertUser.run(
      email,
      hashedPassword,
      name,
      fullName || name,
      role,
      companyName || null
    );
    
    const newUser = db.prepare('SELECT id, email, name, fullName, role, companyName FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// --- Admin-only user management (list, get, create, update) ---
const getAdminFromToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.query.token || req.query.role;
  if (token && token !== 'admin' && !token.includes('admin')) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(decoded.id);
      if (user) {
        req.user = { id: user.id, role: user.role };
        return next();
      }
    } catch (e) {}
  }
  if (token?.includes('admin')) {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'admin' LIMIT 1").get();
    req.user = user ? { id: user.id, role: 'admin' } : { id: 'admin-1', role: 'admin' };
  } else {
    req.user = null;
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// List users (admin). Query: ?role=worker|employer|admin
router.get('/users', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const role = req.query.role;
    let rows;
    const cols = 'id, email, name, fullName, role, companyName, phone, address, createdAt, is_demo_account, demo_password';
    if (role && ['admin', 'employer', 'worker'].includes(role)) {
      rows = db.prepare(`SELECT ${cols} FROM users WHERE role = ? ORDER BY id`).all(role);
    } else {
      rows = db.prepare(`SELECT ${cols} FROM users ORDER BY role, id`).all();
    }
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('List users error:', e);
    res.status(500).json({ success: false, message: 'Failed to list users' });
  }
});

// Get one user (admin)
router.get('/users/:id', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid user id' });
    const user = db.prepare('SELECT id, email, name, fullName, role, companyName, phone, address, createdAt, is_demo_account, demo_password FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (e) {
    console.error('Get user error:', e);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// Create user (admin). Body: email, password, name, fullName?, role, companyName?, phone?, address?, is_demo_account?, demo_password?
router.post('/users', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const { email, password, name, fullName, role, companyName, phone, address, is_demo_account, demo_password } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields: email, password, name, role' });
    }
    if (!['admin', 'employer', 'worker'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Use admin, employer, or worker' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const demoAccount = is_demo_account === true || is_demo_account === 1 || String(is_demo_account) === 'true' ? 1 : 0;
    const demoPwd = demo_password != null && String(demo_password).trim() !== '' ? String(demo_password).trim() : null;
    db.prepare(`
      INSERT INTO users (email, password, name, fullName, role, companyName, phone, address, is_demo_account, demo_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(email, hashedPassword, name || email, fullName || name || email, role, companyName || null, phone || null, address || null, demoAccount, demoPwd);
    const newUser = db.prepare('SELECT id, email, name, fullName, role, companyName, phone, address, createdAt, is_demo_account, demo_password FROM users WHERE email = ?').get(email);
    res.status(201).json({ success: true, data: newUser, message: 'User created' });
  } catch (e) {
    console.error('Create user error:', e);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Update user (admin). Body: email?, name?, fullName?, role?, companyName?, phone?, address?, password?, is_demo_account?, demo_password?
router.put('/users/:id', getAdminFromToken, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid user id' });
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'User not found' });

    const { email, name, fullName, role, companyName, phone, address, password, is_demo_account, demo_password } = req.body;
    const updates = [];
    const values = [];

    if (email !== undefined) {
      const other = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
      if (other) return res.status(400).json({ success: false, message: 'Another user already has this email' });
      updates.push('email = ?');
      values.push(email);
    }
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (fullName !== undefined) { updates.push('fullName = ?'); values.push(fullName); }
    if (role !== undefined) {
      if (!['admin', 'employer', 'worker'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      updates.push('role = ?');
      values.push(role);
    }
    if (companyName !== undefined) { updates.push('companyName = ?'); values.push(companyName); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (password !== undefined && password !== '') {
      updates.push('password = ?');
      values.push(bcrypt.hashSync(password, 10));
    }
    if (is_demo_account !== undefined) {
      updates.push('is_demo_account = ?');
      values.push(is_demo_account === true || is_demo_account === 1 || String(is_demo_account) === 'true' ? 1 : 0);
    }
    if (demo_password !== undefined) {
      updates.push('demo_password = ?');
      values.push(demo_password != null && String(demo_password).trim() !== '' ? String(demo_password).trim() : null);
    }

    if (updates.length === 0) {
      const user = db.prepare('SELECT id, email, name, fullName, role, companyName, phone, address, createdAt, is_demo_account, demo_password FROM users WHERE id = ?').get(id);
      return res.json({ success: true, data: user, message: 'No changes' });
    }
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT id, email, name, fullName, role, companyName, phone, address, createdAt, is_demo_account, demo_password FROM users WHERE id = ?').get(id);
    res.json({ success: true, data: updated, message: 'User updated' });
  } catch (e) {
    console.error('Update user error:', e);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

module.exports = router;
