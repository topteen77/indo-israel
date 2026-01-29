const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper function to parse interview assessment from database row
function parseInterviewAssessment(row) {
  return {
    id: row.id,
    applicationId: row.applicationId,
    interviewerId: row.interviewerId,
    interviewDate: row.interviewDate,
    interviewDuration: row.interviewDuration,
    interviewType: row.interviewType,
    interviewLocation: row.interviewLocation,
    technicalKnowledge: row.technicalKnowledge,
    technicalKnowledgeNotes: row.technicalKnowledgeNotes,
    experienceRelevance: row.experienceRelevance,
    experienceRelevanceNotes: row.experienceRelevanceNotes,
    qualifications: row.qualifications,
    qualificationsNotes: row.qualificationsNotes,
    communicationSkills: row.communicationSkills,
    communicationSkillsNotes: row.communicationSkillsNotes,
    languageProficiency: row.languageProficiency,
    languageProficiencyNotes: row.languageProficiencyNotes,
    problemSolving: row.problemSolving,
    problemSolvingNotes: row.problemSolvingNotes,
    adaptability: row.adaptability,
    adaptabilityNotes: row.adaptabilityNotes,
    overallImpression: row.overallImpression,
    overallImpressionNotes: row.overallImpressionNotes,
    recommendation: row.recommendation,
    recommendationNotes: row.recommendationNotes,
    strengths: row.strengths,
    weaknesses: row.weaknesses,
    additionalNotes: row.additionalNotes,
    totalScore: row.totalScore,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * POST /api/interviews/assessment
 * Submit a new interview assessment
 */
router.post('/assessment', (req, res) => {
  try {
    const {
      applicationId,
      interviewerId,
      interviewDate,
      interviewDuration,
      interviewType,
      interviewLocation,
      technicalKnowledge,
      technicalKnowledgeNotes,
      experienceRelevance,
      experienceRelevanceNotes,
      qualifications,
      qualificationsNotes,
      communicationSkills,
      communicationSkillsNotes,
      languageProficiency,
      languageProficiencyNotes,
      problemSolving,
      problemSolvingNotes,
      adaptability,
      adaptabilityNotes,
      overallImpression,
      overallImpressionNotes,
      recommendation,
      recommendationNotes,
      strengths,
      weaknesses,
      additionalNotes,
      totalScore,
    } = req.body;

    // Validation
    if (!applicationId || !interviewerId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID and Interviewer ID are required',
      });
    }

    if (!recommendation) {
      return res.status(400).json({
        success: false,
        message: 'Recommendation is required',
      });
    }

    // Check if application exists
    const application = db.prepare('SELECT id, status FROM applications WHERE id = ?').get(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Check if assessment already exists for this application
    const existingAssessment = db
      .prepare('SELECT id FROM interview_assessments WHERE applicationId = ?')
      .get(applicationId);

    if (existingAssessment) {
      return res.status(400).json({
        success: false,
        message: 'Assessment already exists for this application. Use PUT to update.',
      });
    }

    // Insert assessment
    const insertStmt = db.prepare(`
      INSERT INTO interview_assessments (
        applicationId, interviewerId, interviewDate, interviewDuration,
        interviewType, interviewLocation, technicalKnowledge, technicalKnowledgeNotes,
        experienceRelevance, experienceRelevanceNotes, qualifications, qualificationsNotes,
        communicationSkills, communicationSkillsNotes, languageProficiency, languageProficiencyNotes,
        problemSolving, problemSolvingNotes, adaptability, adaptabilityNotes,
        overallImpression, overallImpressionNotes, recommendation, recommendationNotes,
        strengths, weaknesses, additionalNotes, totalScore, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      applicationId,
      interviewerId,
      interviewDate || null,
      interviewDuration || null,
      interviewType || null,
      interviewLocation || null,
      technicalKnowledge || 0,
      technicalKnowledgeNotes || null,
      experienceRelevance || 0,
      experienceRelevanceNotes || null,
      qualifications || 0,
      qualificationsNotes || null,
      communicationSkills || 0,
      communicationSkillsNotes || null,
      languageProficiency || 0,
      languageProficiencyNotes || null,
      problemSolving || 0,
      problemSolvingNotes || null,
      adaptability || 0,
      adaptabilityNotes || null,
      overallImpression || 0,
      overallImpressionNotes || null,
      recommendation,
      recommendationNotes || null,
      strengths || null,
      weaknesses || null,
      additionalNotes || null,
      totalScore || 0,
      new Date().toISOString()
    );

    // Update application status based on recommendation
    let newStatus = application.status;
    if (recommendation === 'strongly_recommend' || recommendation === 'recommend') {
      newStatus = 'under_review'; // Move to next stage
    } else if (recommendation === 'not_recommend') {
      newStatus = 'rejected';
    }

    // Update application status
    db.prepare('UPDATE applications SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(
      newStatus,
      applicationId
    );

    // Get the created assessment
    const assessment = db
      .prepare('SELECT * FROM interview_assessments WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Interview assessment submitted successfully',
      data: parseInterviewAssessment(assessment),
    });
  } catch (error) {
    console.error('Error submitting interview assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit interview assessment',
      error: error.message,
    });
  }
});

/**
 * GET /api/interviews/assessment/:id
 * Get interview assessment by ID
 */
router.get('/assessment/:id', (req, res) => {
  try {
    const { id } = req.params;

    const assessment = db.prepare('SELECT * FROM interview_assessments WHERE id = ?').get(id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    res.json({
      success: true,
      data: parseInterviewAssessment(assessment),
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment',
      error: error.message,
    });
  }
});

/**
 * GET /api/interviews/application/:applicationId
 * Get interview assessment for a specific application
 */
router.get('/application/:applicationId', (req, res) => {
  try {
    const { applicationId } = req.params;

    const assessment = db
      .prepare('SELECT * FROM interview_assessments WHERE applicationId = ?')
      .get(applicationId);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found for this application',
      });
    }

    res.json({
      success: true,
      data: parseInterviewAssessment(assessment),
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment',
      error: error.message,
    });
  }
});

/**
 * PUT /api/interviews/assessment/:id
 * Update an existing interview assessment
 */
router.put('/assessment/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if assessment exists
    const existing = db.prepare('SELECT id, applicationId FROM interview_assessments WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    // Build update query dynamically
    const allowedFields = [
      'interviewDate', 'interviewDuration', 'interviewType', 'interviewLocation',
      'technicalKnowledge', 'technicalKnowledgeNotes',
      'experienceRelevance', 'experienceRelevanceNotes',
      'qualifications', 'qualificationsNotes',
      'communicationSkills', 'communicationSkillsNotes',
      'languageProficiency', 'languageProficiencyNotes',
      'problemSolving', 'problemSolvingNotes',
      'adaptability', 'adaptabilityNotes',
      'overallImpression', 'overallImpressionNotes',
      'recommendation', 'recommendationNotes',
      'strengths', 'weaknesses', 'additionalNotes',
      'totalScore',
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

    const updateQuery = `UPDATE interview_assessments SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...values);

    // Update application status if recommendation changed
    if (updateData.recommendation) {
      const application = db.prepare('SELECT status FROM applications WHERE id = ?').get(existing.applicationId);
      let newStatus = application.status;
      
      if (updateData.recommendation === 'strongly_recommend' || updateData.recommendation === 'recommend') {
        newStatus = 'under_review';
      } else if (updateData.recommendation === 'not_recommend') {
        newStatus = 'rejected';
      }

      db.prepare('UPDATE applications SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(
        newStatus,
        existing.applicationId
      );
    }

    // Get updated assessment
    const assessment = db.prepare('SELECT * FROM interview_assessments WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: parseInterviewAssessment(assessment),
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assessment',
      error: error.message,
    });
  }
});

/**
 * GET /api/interviews/all
 * Get all interview assessments (with optional filters)
 */
router.get('/all', (req, res) => {
  try {
    const { applicationId, interviewerId, recommendation, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM interview_assessments WHERE 1=1';
    const params = [];

    if (applicationId) {
      query += ' AND applicationId = ?';
      params.push(applicationId);
    }

    if (interviewerId) {
      query += ' AND interviewerId = ?';
      params.push(interviewerId);
    }

    if (recommendation) {
      query += ' AND recommendation = ?';
      params.push(recommendation);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const assessments = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        assessments: assessments.map(parseInterviewAssessment),
        total: assessments.length,
      },
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessments',
      error: error.message,
    });
  }
});

module.exports = router;
