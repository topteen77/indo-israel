#!/usr/bin/env node
/**
 * Initialize database on first run: seed users/jobs if users table is empty.
 * Safe to run on every container start - only seeds when no users exist.
 */
const db = require('../database/db');
const { seedUsers, seedJobs, seedApplications } = require('../database/seed');

function initDb() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount > 0) {
      console.log(`✅ Database already has ${userCount} users, skipping seed`);
      return;
    }
    console.log('🌱 Database empty, seeding initial data...');
    seedUsers();
    seedJobs();
    seedApplications();
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database init failed:', err);
    process.exit(1);
  }
}

initDb();
