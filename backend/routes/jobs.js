const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all jobs with optional filters
router.get('/all', (req, res) => {
  try {
    const { category, search, status = 'active' } = req.query;
    
    let query = 'SELECT * FROM jobs WHERE 1=1';
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

// Get jobs by category
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE category = ? AND status = 'active'
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
    const searchPattern = `%${decodedSearchTerm}%`;
    
    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE (title LIKE ? OR description LIKE ? OR company LIKE ? OR category LIKE ?)
      AND status = 'active'
      ORDER BY createdAt DESC
    `).all(searchPattern, searchPattern, searchPattern, searchPattern);
    
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
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    
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

    const insertJob = db.prepare(`
      INSERT INTO jobs (title, company, location, salary, experience, type, description, requirements, category, openings, status, postedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          openings = COALESCE(?, openings),
          status = COALESCE(?, status),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateJob.run(
      title, company, location, salary, experience, type,
      description, requirements ? JSON.stringify(requirements) : null,
      category, openings, status, id
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
