const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get industries with job counts
// IMPORTANT: Only counts jobs from Book1.xlsx (jobs with vacancyCode or postedDate)
router.get('/industries', (req, res) => {
  try {
    const industries = db.prepare(`
      SELECT 
        COALESCE(industry, category, 'Other') as industry,
        COUNT(*) as jobCount,
        SUM(openings) as totalOpenings
      FROM jobs 
      WHERE status = 'active'
      AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))
      GROUP BY COALESCE(industry, category, 'Other')
      ORDER BY jobCount DESC
    `).all();
    
    res.json({
      success: true,
      data: {
        industries: industries
      }
    });
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch industries'
    });
  }
});

// Get all jobs with optional filters
// IMPORTANT: Only returns jobs from Book1.xlsx (jobs with vacancyCode or postedDate)
router.get('/all', (req, res) => {
  try {
    const { category, search, status = 'active', groupByIndustry } = req.query;
    
    // Only show jobs from Excel (Book1.xlsx) - identified by having vacancyCode or postedDate
    let query = "SELECT * FROM jobs WHERE (vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != '')";
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR company LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const jobs = db.prepare(query).all(...params);
    
    // Parse JSON fields
    const jobsWithParsed = jobs.map(job => ({
      ...job,
      requirements: job.requirements ? JSON.parse(job.requirements) : [],
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    }));
    
    // If groupByIndustry is requested, group jobs by industry
    // IMPORTANT: Use same COALESCE logic as industries endpoint for consistency
    if (groupByIndustry === 'true') {
      const groupedByIndustry = {};
      jobsWithParsed.forEach(job => {
        // Use same COALESCE logic as industries endpoint: COALESCE(industry, category, 'Other')
        const industry = job.industry || job.category || 'Other';
        // Normalize industry name to match exactly with industries endpoint
        const normalizedIndustry = industry.trim();
        if (!groupedByIndustry[normalizedIndustry]) {
          groupedByIndustry[normalizedIndustry] = [];
        }
        groupedByIndustry[normalizedIndustry].push(job);
      });
      
      return res.json({
        success: true,
        data: {
          totalJobs: jobsWithParsed.length,
          jobs: jobsWithParsed,
          groupedByIndustry: groupedByIndustry
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        totalJobs: jobsWithParsed.length,
        jobs: jobsWithParsed
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs'
    });
  }
});

// Get jobs by industry
// IMPORTANT: Only returns jobs from Book1.xlsx (jobs with vacancyCode or postedDate)
router.get('/industry/:industry', (req, res) => {
  try {
    const { industry } = req.params;
    const decodedIndustry = decodeURIComponent(industry);
    
    // Use COALESCE to match industry or category, same as industries endpoint
    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE status = 'active'
      AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))
      AND (COALESCE(industry, category, 'Other') = ?)
      ORDER BY createdAt DESC
    `).all(decodedIndustry);
    
    const jobsWithParsed = jobs.map(job => ({
      ...job,
      requirements: job.requirements ? JSON.parse(job.requirements) : []
    }));
    
    res.json({
      success: true,
      data: {
        industry: decodedIndustry,
        totalJobs: jobsWithParsed.length,
        jobs: jobsWithParsed
      }
    });
  } catch (error) {
    console.error('Error fetching jobs by industry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs'
    });
  }
});

// Get jobs by category
// IMPORTANT: Only returns jobs from Book1.xlsx (jobs with vacancyCode or postedDate)
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE category = ? AND status = 'active'
      AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))
      ORDER BY createdAt DESC
    `).all(category);
    
    const jobsWithParsed = jobs.map(job => ({
      ...job,
      requirements: job.requirements ? JSON.parse(job.requirements) : []
    }));
    
    res.json({
      success: true,
      data: {
        category,
        totalJobs: jobsWithParsed.length,
        jobs: jobsWithParsed
      }
    });
  } catch (error) {
    console.error('Error fetching jobs by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs'
    });
  }
});

// Get jobs by search term
router.get('/search/:searchTerm', (req, res) => {
  try {
    const { searchTerm } = req.params;
    const decodedSearchTerm = decodeURIComponent(searchTerm);
    const searchLower = decodedSearchTerm.toLowerCase().trim();
    
    let query = 'SELECT * FROM jobs WHERE status = ?';
    const params = ['active'];
    let useFallback = false;
    
    // Map popular search terms to job attributes
    // Normalize search term - remove "jobs" and extra spaces
    const normalizedSearch = searchLower.replace(/^jobs\s+for\s+/, '').replace(/\s+jobs$/, '').trim();
    
    if (normalizedSearch.includes('fresher') || normalizedSearch === 'freshers' || searchLower === 'jobs for freshers') {
      // Jobs for freshers: low experience (0-1 years, fresher, entry level)
      query += ` AND (
        experience LIKE ? OR 
        experience LIKE ? OR 
        experience LIKE ? OR
        experience LIKE ? OR
        LOWER(description) LIKE ? OR
        LOWER(title) LIKE ?
      )`;
      params.push('%0%', '%0-1%', '%0-2%', '%fresher%', '%fresher%', '%fresher%');
    } else if (normalizedSearch.includes('work from home') || searchLower.includes('work from home jobs') || normalizedSearch.includes('remote') || normalizedSearch.includes('wfh')) {
      // Work from home jobs: Remote type, or any job (fallback if no remote jobs exist)
      query += ` AND (
        UPPER(type) LIKE ? OR 
        UPPER(location) LIKE ? OR 
        LOWER(description) LIKE ? OR
        LOWER(title) LIKE ? OR
        LOWER(location) LIKE ?
      )`;
      params.push('%REMOTE%', '%REMOTE%', '%remote%', '%remote%', '%work from home%');
      useFallback = true; // If no matches, show all jobs
    } else if (normalizedSearch.includes('part time') || searchLower === 'part time jobs' || normalizedSearch === 'part time') {
      // Part time jobs: Part-time type, or show all if no part-time jobs exist
      query += ` AND (
        UPPER(type) LIKE ? OR 
        LOWER(type) LIKE ? OR
        LOWER(description) LIKE ? OR
        LOWER(title) LIKE ?
      )`;
      params.push('%PART%', '%part%', '%part time%', '%part-time%');
      useFallback = true; // If no matches, show all jobs
    } else if (normalizedSearch.includes('full time') || searchLower === 'full time jobs' || normalizedSearch === 'full time') {
      // Full time jobs: Full-time type (most common)
      query += ` AND (
        UPPER(type) LIKE ? OR 
        LOWER(type) LIKE ? OR
        LOWER(description) LIKE ? OR
        LOWER(title) LIKE ?
      )`;
      params.push('%FULL%', '%full%', '%full time%', '%full-time%');
    } else if (normalizedSearch.includes('women') || searchLower === 'jobs for women' || normalizedSearch === 'women') {
      // Jobs for women: search in description, title, category, or show all (fallback)
      query += ` AND (
        LOWER(description) LIKE ? OR 
        LOWER(title) LIKE ? OR
        LOWER(category) LIKE ? OR
        LOWER(company) LIKE ?
      )`;
      params.push('%women%', '%women%', '%women%', '%women%');
      useFallback = true; // If no matches, show all jobs
    } else {
      // General search: search in title, description, company, category, type, experience
      const searchPattern = `%${decodedSearchTerm}%`;
      query += ` AND (
        LOWER(title) LIKE ? OR 
        LOWER(description) LIKE ? OR 
        LOWER(company) LIKE ? OR 
        LOWER(category) LIKE ? OR
        LOWER(type) LIKE ? OR
        LOWER(experience) LIKE ?
      )`;
      params.push(searchPattern.toLowerCase(), searchPattern.toLowerCase(), searchPattern.toLowerCase(), searchPattern.toLowerCase(), searchPattern.toLowerCase(), searchPattern.toLowerCase());
    }
    
    query += " AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))";
    query += ' ORDER BY createdAt DESC';
    
    let jobs = db.prepare(query).all(...params);
    
    // Fallback: if no jobs found and fallback is enabled, show all Excel jobs (from Book1.xlsx)
    if (jobs.length === 0 && useFallback) {
      jobs = db.prepare("SELECT * FROM jobs WHERE status = ? AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != '')) ORDER BY createdAt DESC").all('active');
    }
    
    const jobsWithParsed = jobs.map(job => ({
      ...job,
      requirements: job.requirements ? JSON.parse(job.requirements) : []
    }));
    
    res.json({
      success: true,
      data: {
        searchTerm: decodedSearchTerm,
        totalJobs: jobsWithParsed.length,
        jobs: jobsWithParsed
      }
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs'
    });
  }
});

// Get single job by ID
// IMPORTANT: Only returns jobs from Book1.xlsx (jobs with vacancyCode or postedDate)
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = db.prepare("SELECT * FROM jobs WHERE id = ? AND status = ? AND ((vacancyCode IS NOT NULL AND vacancyCode != '') OR (postedDate IS NOT NULL AND postedDate != ''))").get(id, 'active');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...job,
        requirements: job.requirements ? JSON.parse(job.requirements) : []
      }
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job'
    });
  }
});

// Create new job
// IMPORTANT: Job creation is restricted - only Excel jobs (from Book1.xlsx) are allowed in the system
// This endpoint is kept for backward compatibility but new jobs should be added via Excel import
router.post('/create', (req, res) => {
  try {
    const {
      title,
      company,
      location,
      salary,
      experience,
      type,
      description,
      requirements,
      category,
      openings,
      postedBy
    } = req.body;

    // Validate required fields
    if (!title || !company || !location || !salary || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Warn that only Excel jobs should be added
    console.warn('[Jobs API] Job creation via API - Note: Only jobs from Book1.xlsx are displayed. Use Excel import for new jobs.');

    const insertJob = db.prepare(`
      INSERT INTO jobs (title, company, location, salary, experience, type, description, requirements, category, industry, openings, status, postedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertJob.run(
      title,
      company,
      location,
      salary,
      experience || 'Not specified',
      type || 'Full-time',
      description,
      JSON.stringify(Array.isArray(requirements) ? requirements : (requirements ? [requirements] : [])),
      category,
      category, // Use category as industry if not provided
      openings || 1,
      'active',
      postedBy || null
    );

    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: {
        ...newJob,
        requirements: newJob.requirements ? JSON.parse(newJob.requirements) : []
      }
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job'
    });
  }
});

// Update job
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, company, location, salary, experience, type,
      description, requirements, category, openings, status
    } = req.body;

    const updateJob = db.prepare(`
      UPDATE jobs 
      SET title = COALESCE(?, title),
          company = COALESCE(?, company),
          location = COALESCE(?, location),
          salary = COALESCE(?, salary),
          experience = COALESCE(?, experience),
          type = COALESCE(?, type),
          description = COALESCE(?, description),
          requirements = COALESCE(?, requirements),
          category = COALESCE(?, category),
          industry = COALESCE(?, industry),
          openings = COALESCE(?, openings),
          status = COALESCE(?, status),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const { industry } = req.body;
    updateJob.run(
      title, company, location, salary, experience, type,
      description, requirements ? JSON.stringify(requirements) : null,
      category, industry, openings, status, id
    );

    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: {
        ...updatedJob,
        requirements: updatedJob.requirements ? JSON.parse(updatedJob.requirements) : []
      }
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job'
    });
  }
});

// Delete job
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleteJob = db.prepare('DELETE FROM jobs WHERE id = ?');
    const result = deleteJob.run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job'
    });
  }
});

module.exports = router;
