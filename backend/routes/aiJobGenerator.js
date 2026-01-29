const express = require('express');
const router = express.Router();
const {
  generateJobPost,
  generateBilingualJobPost,
  isAIAvailable,
} = require('../services/aiJobGeneratorService');

/**
 * GET /api/ai-job-generator/status
 * Check if AI service is available
 */
router.get('/status', (req, res) => {
  try {
    const available = isAIAvailable();
    res.json({
      success: true,
      data: {
        available,
        configured: !!process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check AI service status',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-job-generator/generate
 * Generate a job post using AI
 */
router.post('/generate', async (req, res) => {
  try {
    if (!isAIAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure OPENAI_API_KEY.',
      });
    }

    const {
      jobCategory,
      specificTrade,
      experienceRequired,
      qualifications = [],
      languagesRequired = [],
      salaryRange,
      workLocation,
      numberOfWorkers = 1,
      contractDuration,
      accommodationProvided = false,
      transportationProvided = false,
      otherBenefits = '',
      language = 'en',
      tone = 'professional',
      includeBenefits = true,
      includeRequirements = true,
      includeCompliance = true,
    } = req.body;

    // Validate required fields
    if (!jobCategory || !workLocation) {
      return res.status(400).json({
        success: false,
        message: 'Job category and work location are required',
      });
    }

    const jobData = {
      jobCategory,
      specificTrade,
      experienceRequired,
      qualifications: Array.isArray(qualifications) ? qualifications : [],
      languagesRequired: Array.isArray(languagesRequired) ? languagesRequired : [],
      salaryRange,
      workLocation,
      numberOfWorkers,
      contractDuration,
      accommodationProvided,
      transportationProvided,
      otherBenefits,
      language,
    };

    const options = {
      tone,
      includeBenefits,
      includeRequirements,
      includeCompliance,
    };

    const result = await generateJobPost(jobData, options);

    res.json({
      success: true,
      message: 'Job post generated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error generating job post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate job post',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-job-generator/generate-bilingual
 * Generate bilingual job post (English and Hebrew)
 */
router.post('/generate-bilingual', async (req, res) => {
  try {
    if (!isAIAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure OPENAI_API_KEY.',
      });
    }

    const {
      jobCategory,
      specificTrade,
      experienceRequired,
      qualifications = [],
      languagesRequired = [],
      salaryRange,
      workLocation,
      numberOfWorkers = 1,
      contractDuration,
      accommodationProvided = false,
      transportationProvided = false,
      otherBenefits = '',
      tone = 'professional',
      includeBenefits = true,
      includeRequirements = true,
      includeCompliance = true,
    } = req.body;

    // Validate required fields
    if (!jobCategory || !workLocation) {
      return res.status(400).json({
        success: false,
        message: 'Job category and work location are required',
      });
    }

    const jobData = {
      jobCategory,
      specificTrade,
      experienceRequired,
      qualifications: Array.isArray(qualifications) ? qualifications : [],
      languagesRequired: Array.isArray(languagesRequired) ? languagesRequired : [],
      salaryRange,
      workLocation,
      numberOfWorkers,
      contractDuration,
      accommodationProvided,
      transportationProvided,
      otherBenefits,
    };

    const options = {
      tone,
      includeBenefits,
      includeRequirements,
      includeCompliance,
    };

    const result = await generateBilingualJobPost(jobData, options);

    res.json({
      success: true,
      message: 'Bilingual job post generated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error generating bilingual job post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bilingual job post',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-job-generator/from-merf
 * Generate job post from MERF requisition
 */
router.post('/from-merf', async (req, res) => {
  try {
    if (!isAIAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure OPENAI_API_KEY.',
      });
    }

    const { requisitionId } = req.body;

    if (!requisitionId) {
      return res.status(400).json({
        success: false,
        message: 'Requisition ID is required',
      });
    }

    // Fetch MERF requisition from database
    const db = require('../database/db');
    const requisition = db
      .prepare('SELECT * FROM employer_requisitions WHERE id = ? OR requisitionNumber = ?')
      .get(requisitionId, requisitionId);

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: 'Requisition not found',
      });
    }

    // Parse requisition data
    const jobData = {
      jobCategory: requisition.jobCategory,
      specificTrade: requisition.specificTrade || null,
      experienceRequired: requisition.experienceRequired || null,
      qualifications: requisition.qualifications ? JSON.parse(requisition.qualifications) : [],
      languagesRequired: requisition.languagesRequired ? JSON.parse(requisition.languagesRequired) : [],
      salaryRange: requisition.salaryRange || null,
      workLocation: requisition.workLocation || null,
      numberOfWorkers: requisition.numberOfWorkers || 1,
      contractDuration: requisition.contractDuration || null,
      accommodationProvided: requisition.accommodationProvided === 1,
      transportationProvided: requisition.transportationProvided === 1,
      otherBenefits: requisition.otherBenefits || '',
      language: requisition.language || 'en',
    };

    const options = {
      tone: 'professional',
      includeBenefits: true,
      includeRequirements: true,
      includeCompliance: true,
    };

    // Generate bilingual if Hebrew fields exist
    const generateBilingual = requisition.titleHe || requisition.descriptionHe;
    
    let result;
    if (generateBilingual) {
      result = await generateBilingualJobPost(jobData, options);
    } else {
      const englishPost = await generateJobPost(jobData, options);
      result = {
        success: true,
        english: englishPost.jobPost,
        hebrew: null,
        compliance: {
          checked: englishPost.jobPost.complianceChecked,
          flags: englishPost.jobPost.complianceFlags || [],
        },
      };
    }

    res.json({
      success: true,
      message: 'Job post generated from MERF requisition',
      data: {
        ...result,
        requisitionId: requisition.id,
        requisitionNumber: requisition.requisitionNumber,
      },
    });
  } catch (error) {
    console.error('Error generating job post from MERF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate job post from MERF',
      error: error.message,
    });
  }
});

module.exports = router;
