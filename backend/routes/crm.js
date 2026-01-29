const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper function to parse note from database row
function parseNote(row) {
  return {
    id: row.id,
    candidateId: row.candidateId,
    applicationId: row.applicationId,
    content: row.content,
    tags: row.tags ? JSON.parse(row.tags) : [],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Helper function to parse activity from database row
function parseActivity(row) {
  return {
    id: row.id,
    candidateId: row.candidateId,
    applicationId: row.applicationId,
    type: row.type,
    description: row.description,
    details: row.details,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    userId: row.userId,
    createdAt: row.createdAt,
  };
}

/**
 * POST /api/crm/notes
 * Create a new note
 */
router.post('/notes', (req, res) => {
  try {
    const { candidateId, applicationId, content, tags } = req.body;
    const userId = req.user?.id || req.body.userId; // Get from auth middleware or body

    if (!content || (!candidateId && !applicationId)) {
      return res.status(400).json({
        success: false,
        message: 'Content and candidateId or applicationId are required',
      });
    }

    const insertStmt = db.prepare(`
      INSERT INTO crm_notes (candidateId, applicationId, content, tags, createdBy)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      candidateId || null,
      applicationId || null,
      content,
      tags ? JSON.stringify(tags) : '[]',
      userId || null
    );

    const note = db.prepare('SELECT * FROM crm_notes WHERE id = ?').get(result.lastInsertRowid);

    // Create activity log
    db.prepare(`
      INSERT INTO crm_activities (candidateId, applicationId, type, description, details, userId)
      VALUES (?, ?, 'note_added', 'Note added', ?, ?)
    `).run(candidateId || null, applicationId || null, content.substring(0, 100), userId || null);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: parseNote(note),
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message,
    });
  }
});

/**
 * GET /api/crm/notes
 * Get notes for a candidate or application
 */
router.get('/notes', (req, res) => {
  try {
    const { candidateId, applicationId } = req.query;

    let query = 'SELECT * FROM crm_notes WHERE 1=1';
    const params = [];

    if (candidateId) {
      query += ' AND candidateId = ?';
      params.push(candidateId);
    }

    if (applicationId) {
      query += ' AND applicationId = ?';
      params.push(applicationId);
    }

    query += ' ORDER BY createdAt DESC';

    const notes = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        notes: notes.map(parseNote),
      },
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message,
    });
  }
});

/**
 * PUT /api/crm/notes/:id
 * Update a note
 */
router.put('/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { content, tags } = req.body;

    const existing = db.prepare('SELECT id FROM crm_notes WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    db.prepare(`
      UPDATE crm_notes
      SET content = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content, tags ? JSON.stringify(tags) : '[]', id);

    const note = db.prepare('SELECT * FROM crm_notes WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: parseNote(note),
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/crm/notes/:id
 * Delete a note
 */
router.delete('/notes/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM crm_notes WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    db.prepare('DELETE FROM crm_notes WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message,
    });
  }
});

/**
 * GET /api/crm/activities
 * Get activities for a candidate or application
 */
router.get('/activities', (req, res) => {
  try {
    const { candidateId, applicationId, limit = 50 } = req.query;

    let query = 'SELECT * FROM crm_activities WHERE 1=1';
    const params = [];

    if (candidateId) {
      query += ' AND candidateId = ?';
      params.push(candidateId);
    }

    if (applicationId) {
      query += ' AND applicationId = ?';
      params.push(applicationId);
    }

    query += ' ORDER BY createdAt DESC LIMIT ?';
    params.push(parseInt(limit));

    const activities = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        activities: activities.map(parseActivity),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message,
    });
  }
});

/**
 * POST /api/crm/bulk-actions
 * Perform bulk actions on applications
 */
router.post('/bulk-actions', (req, res) => {
  try {
    const { action, applicationIds, reason } = req.body;

    if (!action || !applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action and applicationIds array are required',
      });
    }

    const validActions = ['approve', 'reject', 'archive', 'delete'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      });
    }

    const placeholders = applicationIds.map(() => '?').join(',');
    let updateQuery = '';

    switch (action) {
      case 'approve':
        updateQuery = `UPDATE applications SET status = 'approved', updatedAt = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
        break;
      case 'reject':
        updateQuery = `UPDATE applications SET status = 'rejected', updatedAt = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
        // Store rejection reason if provided
        if (reason) {
          // You might want to add a rejectionReason field to applications table
        }
        break;
      case 'archive':
        updateQuery = `UPDATE applications SET status = 'archived', updatedAt = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`;
        break;
      case 'delete':
        updateQuery = `DELETE FROM applications WHERE id IN (${placeholders})`;
        break;
    }

    const result = db.prepare(updateQuery).run(...applicationIds);

    // Log activities
    const userId = req.user?.id || null;
    applicationIds.forEach((appId) => {
      db.prepare(`
        INSERT INTO crm_activities (applicationId, type, description, userId)
        VALUES (?, ?, ?, ?)
      `).run(
        appId,
        `application_${action}ed`,
        `Application ${action}ed`,
        userId
      );
    });

    res.json({
      success: true,
      message: `Successfully ${action}d ${result.changes} application(s)`,
      data: {
        affectedCount: result.changes,
      },
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action',
      error: error.message,
    });
  }
});

module.exports = router;
