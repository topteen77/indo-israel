#!/usr/bin/env node
/**
 * Reset admin password (or create admin if none exists).
 * Usage (from project root, with .env loaded):
 *   node backend/scripts/reset-admin-password.js [email] [newPassword]
 * Example:
 *   node backend/scripts/reset-admin-password.js admin@apravas.com mynewpass
 * If no args: resets first admin user to password "admin123".
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../database/db');
const bcrypt = require('bcryptjs');

const email = process.argv[2] || null;
const newPassword = process.argv[3] || 'admin123';

function run() {
  if (email) {
    const user = db.prepare('SELECT id, email, role FROM users WHERE email = ?').get(email);
    if (!user) {
      // Create new admin user
      const hash = bcrypt.hashSync(newPassword, 10);
      db.prepare(`
        INSERT INTO users (email, password, name, fullName, role)
        VALUES (?, ?, 'Apravas Admin', 'Apravas Admin', 'admin')
      `).run(email, hash);
      console.log('Created admin user:', email, '| Password:', newPassword);
      return;
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(hash, user.id);
    console.log('Password reset for', user.email, '| New password:', newPassword);
    return;
  }

  const admin = db.prepare("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!admin) {
    const defaultEmail = 'admin@apravas.com';
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare(`
      INSERT INTO users (email, password, name, fullName, role)
      VALUES (?, ?, 'Apravas Admin', 'Apravas Admin', 'admin')
    `).run(defaultEmail, hash);
    console.log('Created admin user:', defaultEmail, '| Password:', newPassword);
    return;
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(hash, admin.id);
  console.log('Password reset for', admin.email, '| New password:', newPassword);
}

run();
