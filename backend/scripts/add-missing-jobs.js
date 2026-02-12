#!/usr/bin/env node
/**
 * Add jobs for missing categories: Driver, Security, Cleaning, Cooking/Chef
 * This script adds jobs without clearing existing data
 */
const db = require('../database/db');
const { seedJobsForCategories } = require('../database/seed');

function addMissingJobs() {
  try {
    console.log('🌱 Adding jobs for missing categories...\n');
    
    const missingCategories = ['Driver', 'Security', 'Cleaning', 'Cooking/Chef'];
    seedJobsForCategories(missingCategories);
    
    console.log('\n✅ Successfully added jobs for missing categories!');
    console.log('\n📊 Updated Summary:');
    const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const driverCount = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE category = ?').get('Driver').count;
    const securityCount = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE category = ?').get('Security').count;
    const cleaningCount = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE category = ?').get('Cleaning').count;
    const cookingCount = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE category = ?').get('Cooking/Chef').count;
    
    console.log(`   - Total Jobs: ${jobCount}`);
    console.log(`   - Driver Jobs: ${driverCount}`);
    console.log(`   - Security Jobs: ${securityCount}`);
    console.log(`   - Cleaning Jobs: ${cleaningCount}`);
    console.log(`   - Cooking/Chef Jobs: ${cookingCount}`);
  } catch (error) {
    console.error('❌ Error adding jobs:', error);
    process.exit(1);
  }
}

addMissingJobs();
