const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/db');

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
    
    // Verify password if provided, otherwise allow login (for demo)
    if (req.body.password) {
      const isValidPassword = bcrypt.compareSync(req.body.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
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

module.exports = router;
