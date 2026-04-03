const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const {
  isContractAIAvailable,
  generateEmploymentContractDraft,
} = require('../services/aiContractService');

const router = express.Router();

function employerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Employer access required' });
    }
    req.employerUserId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

router.get('/status', employerAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      aiAvailable: isContractAIAvailable(),
    },
  });
});

/**
 * POST /api/ai-contracts/generate
 * Body: optional applicationId, jobId, employerCompany, candidateName, candidateEmail, jobTitle,
 * salary, workLocation, startDate, contractDurationMonths, probationMonths, workingHours,
 * annualLeaveDays, noticePeriodDays, additionalInstructions, language
 */
router.post('/generate', employerAuth, async (req, res) => {
  try {
    if (!isContractAIAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI contract drafting is not available. Configure OPENAI_API_KEY on the server.',
      });
    }

    const employerId = req.employerUserId;
    const body = req.body || {};

    let employerCompany = (body.employerCompany && String(body.employerCompany).trim()) || '';
    if (!employerCompany) {
      const u = db.prepare('SELECT companyName, fullName, name FROM users WHERE id = ?').get(employerId);
      employerCompany = (u?.companyName || u?.fullName || u?.name || 'Employer').trim();
    }

    let candidateName = (body.candidateName && String(body.candidateName).trim()) || '';
    let candidateEmail = (body.candidateEmail && String(body.candidateEmail).trim()) || '';
    let jobTitle = (body.jobTitle && String(body.jobTitle).trim()) || '';
    let salary = (body.salary && String(body.salary).trim()) || '';
    let workLocation = (body.workLocation && String(body.workLocation).trim()) || '';

    const applicationId = body.applicationId != null ? parseInt(String(body.applicationId), 10) : null;
    if (applicationId) {
      const row = db
        .prepare(
          `SELECT a.* FROM applications a
           INNER JOIN jobs j ON a.jobId = j.id
           WHERE a.id = ? AND j.postedBy = ?`
        )
        .get(applicationId, employerId);
      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or not linked to your jobs',
        });
      }
      candidateName = row.fullName || candidateName;
      candidateEmail = row.email || candidateEmail;
      const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(row.jobId);
      if (job) {
        jobTitle = job.title || jobTitle;
        workLocation = job.location || workLocation;
        salary = job.salary || salary;
      }
    }

    const jobId = body.jobId != null ? parseInt(String(body.jobId), 10) : null;
    if (jobId && !applicationId) {
      const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND postedBy = ?').get(jobId, employerId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found or not owned by your account',
        });
      }
      jobTitle = job.title || jobTitle;
      workLocation = job.location || workLocation;
      salary = job.salary || salary;
    }

    if (!candidateName) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name is required (enter manually or select a pipeline application)',
      });
    }
    if (!jobTitle) {
      return res.status(400).json({
        success: false,
        message: 'Job title is required (enter manually or select a job / application)',
      });
    }

    const ctx = {
      employerCompany,
      candidateName,
      candidateEmail,
      jobTitle,
      salary: salary || body.salary,
      workLocation: workLocation || body.workLocation,
      startDate: body.startDate || '',
      contractDurationMonths: body.contractDurationMonths ?? '',
      probationMonths: body.probationMonths ?? '',
      workingHours: body.workingHours || '',
      annualLeaveDays: body.annualLeaveDays ?? '',
      noticePeriodDays: body.noticePeriodDays ?? '',
      additionalInstructions: (body.additionalInstructions && String(body.additionalInstructions).trim()) || '',
      language: body.language || 'en',
    };

    const result = await generateEmploymentContractDraft(ctx);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI contract generate error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate contract',
    });
  }
});

module.exports = router;
