const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { checkCompliance, validateSalaryRange } = require('../services/complianceService');

// Middleware: resolve user from JWT or fallback to demo token
const getUserFromToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.query.token || req.query.role;

  if (token && !token.includes('admin') && !token.includes('employer') && !token.includes('worker')) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(decoded.id);
      if (user) {
        req.user = { id: user.id, role: user.role };
        return next();
      }
    } catch (e) {
      // Not a valid JWT, fall through to demo logic
    }
  }

  if (token?.includes('admin')) {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'admin' LIMIT 1").get();
    req.user = user ? { id: user.id, role: 'admin' } : { id: 'admin-1', role: 'admin' };
  } else if (token?.includes('employer')) {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'employer' LIMIT 1").get();
    req.user = user ? { id: user.id, role: 'employer' } : { id: 'employer-1', role: 'employer' };
  } else if (token?.includes('worker')) {
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'worker' LIMIT 1").get();
    req.user = user ? { id: user.id, role: 'worker' } : { id: 'worker-1', role: 'worker' };
  } else {
    // Default to first employer if no token
    const user = db.prepare("SELECT id, role FROM users WHERE role = 'employer' LIMIT 1").get();
    req.user = user ? { id: user.id, role: user.role } : { id: 'employer-1', role: 'employer' };
  }
  next();
};

// Helper function to parse MERF requisition from database row
function parseRequisition(row) {
  return {
    id: row.id,
    requisitionNumber: row.requisitionNumber,
    employerId: row.employerId,
    templateId: row.templateId,
    title: row.title,
    titleHe: row.titleHe,
    description: row.description,
    descriptionHe: row.descriptionHe,
    jobCategory: row.jobCategory,
    specificTrade: row.specificTrade,
    numberOfWorkers: row.numberOfWorkers,
    experienceRequired: row.experienceRequired,
    qualifications: row.qualifications ? JSON.parse(row.qualifications) : [],
    languagesRequired: row.languagesRequired ? JSON.parse(row.languagesRequired) : [],
    salaryRange: row.salaryRange,
    workLocation: row.workLocation,
    workLocationHe: row.workLocationHe,
    startDate: row.startDate,
    contractDuration: row.contractDuration,
    accommodationProvided: row.accommodationProvided === 1,
    accommodationDetails: row.accommodationDetails,
    transportationProvided: row.transportationProvided === 1,
    otherBenefits: row.otherBenefits,
    otherBenefitsHe: row.otherBenefitsHe,
    complianceChecked: row.complianceChecked === 1,
    complianceFlags: row.complianceFlags ? JSON.parse(row.complianceFlags) : [],
    status: row.status,
    language: row.language,
    submittedAt: row.submittedAt,
    approvedAt: row.approvedAt,
    approvedBy: row.approvedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Helper function to parse MERF template
function parseTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    nameHe: row.nameHe,
    description: row.description,
    descriptionHe: row.descriptionHe,
    category: row.category,
    fields: row.fields ? JSON.parse(row.fields) : [],
    isActive: row.isActive === 1,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * POST /api/merf/compliance/check
 * Check compliance of MERF data
 */
router.post('/compliance/check', (req, res) => {
  try {
    const complianceResult = checkCompliance(req.body);
    res.json({
      success: true,
      data: complianceResult,
    });
  } catch (error) {
    console.error('Error checking compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check compliance',
      error: error.message,
    });
  }
});

/**
 * POST /api/merf/requisitions
 * Create new MERF requisition
 */
router.post('/requisitions', getUserFromToken, (req, res) => {
  try {
    const requisitionData = req.body;
    const employerId = req.user?.id || requisitionData.employerId; // Get from auth or body

    // Validate employerId is present
    if (!employerId) {
      return res.status(400).json({
        success: false,
        message: 'Employer ID is required. Please ensure you are authenticated.',
      });
    }

    // Validate required fields
    if (!requisitionData.title || !requisitionData.jobCategory || !requisitionData.numberOfWorkers) {
      return res.status(400).json({
        success: false,
        message: 'Title, job category, and number of workers are required',
      });
    }

    // Validate salary range
    if (requisitionData.salaryRange) {
      const salaryValidation = validateSalaryRange(requisitionData.salaryRange);
      if (!salaryValidation.valid) {
        return res.status(400).json({
          success: false,
          message: salaryValidation.message,
        });
      }
    }

    // Check compliance
    const complianceResult = checkCompliance(requisitionData);

    // Generate requisition number
    const requisitionNumber = `MERF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Insert requisition
    const insertStmt = db.prepare(`
      INSERT INTO employer_requisitions (
        requisitionNumber, employerId, templateId, title, titleHe, description, descriptionHe,
        jobCategory, specificTrade, numberOfWorkers, experienceRequired,
        qualifications, languagesRequired, salaryRange, workLocation, workLocationHe,
        startDate, contractDuration, accommodationProvided, accommodationDetails,
        transportationProvided, otherBenefits, otherBenefitsHe,
        complianceChecked, complianceFlags, status, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      requisitionNumber,
      employerId,
      requisitionData.templateId || null,
      requisitionData.title,
      requisitionData.titleHe || null,
      requisitionData.description,
      requisitionData.descriptionHe || null,
      requisitionData.jobCategory,
      requisitionData.specificTrade || null,
      requisitionData.numberOfWorkers,
      requisitionData.experienceRequired || null,
      JSON.stringify(requisitionData.qualifications || []),
      JSON.stringify(requisitionData.languagesRequired || []),
      requisitionData.salaryRange || null,
      requisitionData.workLocation,
      requisitionData.workLocationHe || null,
      requisitionData.startDate || null,
      requisitionData.contractDuration || null,
      requisitionData.accommodationProvided ? 1 : 0,
      requisitionData.accommodationDetails || null,
      requisitionData.transportationProvided ? 1 : 0,
      requisitionData.otherBenefits || null,
      requisitionData.otherBenefitsHe || null,
      complianceResult.compliant ? 1 : 0,
      JSON.stringify(complianceResult.flags),
      requisitionData.status || 'draft',
      requisitionData.language || 'en'
    );

    // Store compliance flags
    if (complianceResult.flags.length > 0) {
      complianceResult.flags.forEach((flag) => {
        db.prepare(`
          INSERT INTO compliance_flags (
            requisitionId, flagType, severity, message, messageHe, field, value
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          result.lastInsertRowid,
          flag.flagType,
          flag.severity,
          flag.message,
          flag.messageHe || flag.message,
          flag.field || null,
          flag.value || null
        );
      });
    }

    // Get created requisition
    const requisition = db
      .prepare('SELECT * FROM employer_requisitions WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'MERF requisition created successfully',
      data: parseRequisition(requisition),
      compliance: complianceResult,
    });
  } catch (error) {
    console.error('Error creating MERF requisition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create MERF requisition',
      error: error.message,
    });
  }
});

/**
 * GET /api/merf/requisitions/:id
 * Get MERF requisition by ID
 */
router.get('/requisitions/:id', (req, res) => {
  try {
    const { id } = req.params;

    const requisition = db
      .prepare('SELECT * FROM employer_requisitions WHERE id = ? OR requisitionNumber = ?')
      .get(id, id);

    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: 'Requisition not found',
      });
    }

    // Get compliance flags
    const flags = db
      .prepare('SELECT * FROM compliance_flags WHERE requisitionId = ? ORDER BY createdAt DESC')
      .all(requisition.id);

    res.json({
      success: true,
      data: {
        ...parseRequisition(requisition),
        complianceFlags: flags.map((f) => ({
          id: f.id,
          flagType: f.flagType,
          severity: f.severity,
          message: f.message,
          messageHe: f.messageHe,
          field: f.field,
          value: f.value,
          resolved: f.resolved === 1,
          resolvedAt: f.resolvedAt,
          notes: f.notes,
          createdAt: f.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching requisition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requisition',
      error: error.message,
    });
  }
});

/**
 * GET /api/merf/requisitions
 * Get all MERF requisitions (with filters)
 */
router.get('/requisitions', (req, res) => {
  try {
    const { employerId, status, jobCategory, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM employer_requisitions WHERE 1=1';
    const params = [];

    if (employerId) {
      query += ' AND employerId = ?';
      params.push(employerId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (jobCategory) {
      query += ' AND jobCategory = ?';
      params.push(jobCategory);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const requisitions = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        requisitions: requisitions.map(parseRequisition),
        total: requisitions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requisitions',
      error: error.message,
    });
  }
});

/**
 * PUT /api/merf/requisitions/:id
 * Update MERF requisition
 */
router.put('/requisitions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if requisition exists
    const existing = db.prepare('SELECT id FROM employer_requisitions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Requisition not found',
      });
    }

    // Re-check compliance if relevant fields changed
    if (updateData.salaryRange || updateData.contractDuration || updateData.description) {
      const current = db.prepare('SELECT * FROM employer_requisitions WHERE id = ?').get(id);
      const mergedData = { ...parseRequisition(current), ...updateData };
      const complianceResult = checkCompliance(mergedData);
      
      updateData.complianceChecked = complianceResult.compliant ? 1 : 0;
      updateData.complianceFlags = JSON.stringify(complianceResult.flags);

      // Update compliance flags
      db.prepare('DELETE FROM compliance_flags WHERE requisitionId = ?').run(id);
      complianceResult.flags.forEach((flag) => {
        db.prepare(`
          INSERT INTO compliance_flags (
            requisitionId, flagType, severity, message, messageHe, field, value
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          flag.flagType,
          flag.severity,
          flag.message,
          flag.messageHe || flag.message,
          flag.field || null,
          flag.value || null
        );
      });
    }

    // Build update query
    const allowedFields = [
      'title', 'titleHe', 'description', 'descriptionHe',
      'jobCategory', 'specificTrade', 'numberOfWorkers', 'experienceRequired',
      'qualifications', 'languagesRequired', 'salaryRange',
      'workLocation', 'workLocationHe', 'startDate', 'contractDuration',
      'accommodationProvided', 'accommodationDetails',
      'transportationProvided', 'otherBenefits', 'otherBenefitsHe',
      'complianceChecked', 'complianceFlags', 'status', 'language',
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === 'qualifications' || field === 'languagesRequired') {
          values.push(JSON.stringify(updateData[field]));
        } else if (field === 'accommodationProvided' || field === 'transportationProvided') {
          values.push(updateData[field] ? 1 : 0);
        } else {
          values.push(updateData[field]);
        }
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

    const updateQuery = `UPDATE employer_requisitions SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...values);

    // Get updated requisition
    const requisition = db.prepare('SELECT * FROM employer_requisitions WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Requisition updated successfully',
      data: parseRequisition(requisition),
    });
  } catch (error) {
    console.error('Error updating requisition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update requisition',
      error: error.message,
    });
  }
});

/**
 * POST /api/merf/requisitions/:id/submit
 * Submit MERF requisition for review
 */
router.post('/requisitions/:id/submit', (req, res) => {
  try {
    const { id } = req.params;

    const requisition = db.prepare('SELECT * FROM employer_requisitions WHERE id = ?').get(id);
    if (!requisition) {
      return res.status(404).json({
        success: false,
        message: 'Requisition not found',
      });
    }

    // Final compliance check
    const complianceResult = checkCompliance(parseRequisition(requisition));

    // Update status
    db.prepare(`
      UPDATE employer_requisitions
      SET status = 'submitted', submittedAt = CURRENT_TIMESTAMP,
          complianceChecked = ?, complianceFlags = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      complianceResult.compliant ? 1 : 0,
      JSON.stringify(complianceResult.flags),
      id
    );

    const updated = db.prepare('SELECT * FROM employer_requisitions WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Requisition submitted successfully',
      data: parseRequisition(updated),
      compliance: complianceResult,
    });
  } catch (error) {
    console.error('Error submitting requisition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit requisition',
      error: error.message,
    });
  }
});

/**
 * POST /api/merf/templates
 * Create MERF template
 */
router.post('/templates', (req, res) => {
  try {
    const { name, nameHe, description, descriptionHe, category, fields, createdBy } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required',
      });
    }

    const insertStmt = db.prepare(`
      INSERT INTO merf_templates (name, nameHe, description, descriptionHe, category, fields, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      name,
      nameHe || null,
      description || null,
      descriptionHe || null,
      category,
      JSON.stringify(fields || []),
      createdBy || null
    );

    const template = db.prepare('SELECT * FROM merf_templates WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: parseTemplate(template),
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message,
    });
  }
});

/**
 * GET /api/merf/templates
 * Get all MERF templates
 */
router.get('/templates', (req, res) => {
  try {
    const { category, active } = req.query;

    let query = 'SELECT * FROM merf_templates WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (active !== undefined) {
      query += ' AND isActive = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY name';

    const templates = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        templates: templates.map(parseTemplate),
      },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message,
    });
  }
});

/**
 * GET /api/merf/templates/:id
 * Get MERF template by ID
 */
router.get('/templates/:id', (req, res) => {
  try {
    const { id } = req.params;

    const template = db.prepare('SELECT * FROM merf_templates WHERE id = ?').get(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: parseTemplate(template),
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message,
    });
  }
});

module.exports = router;
