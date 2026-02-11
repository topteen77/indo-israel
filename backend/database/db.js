const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '..', 'data', 'apravas.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      name TEXT,
      fullName TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employer', 'worker')),
      companyName TEXT,
      phone TEXT,
      address TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      salary TEXT,
      experience TEXT,
      type TEXT DEFAULT 'Full-time',
      description TEXT,
      requirements TEXT, -- JSON array stored as text
      category TEXT NOT NULL,
      openings INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed', 'draft')),
      postedBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postedBy) REFERENCES users(id)
    )
  `);

  // Applications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submissionId TEXT UNIQUE,
      userId INTEGER,
      jobId INTEGER,
      fullName TEXT NOT NULL,
      dateOfBirth DATE,
      gender TEXT,
      maritalStatus TEXT,
      mobileNumber TEXT NOT NULL,
      email TEXT NOT NULL,
      permanentAddress TEXT,
      hasPassport TEXT,
      passportNumber TEXT,
      passportIssuePlace TEXT,
      passportIssueDate DATE,
      passportExpiryDate DATE,
      jobCategory TEXT,
      specificTrade TEXT,
      experienceYears TEXT,
      workedAbroad TEXT,
      countriesWorked TEXT,
      hasCertificate TEXT,
      certificateDetails TEXT,
      canReadDrawings TEXT,
      languages TEXT, -- JSON array stored as text
      medicalCondition TEXT,
      medicalDetails TEXT,
      criminalCase TEXT,
      criminalDetails TEXT,
      declaration INTEGER DEFAULT 0, -- Boolean as integer
      digitalSignature TEXT,
      autoScore INTEGER DEFAULT 0,
      routing TEXT, -- JSON object stored as text
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
      language TEXT DEFAULT 'en',
      files TEXT, -- JSON object stored as text
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (jobId) REFERENCES jobs(id)
    )
  `);

  // Worker profiles: application data for pre-fill (passport, documents refs, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_profiles (
      userId INTEGER PRIMARY KEY,
      profileData TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // MERF Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS merf_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nameHe TEXT, -- Hebrew name
      description TEXT,
      descriptionHe TEXT, -- Hebrew description
      category TEXT NOT NULL,
      fields TEXT NOT NULL, -- JSON array stored as text
      isActive INTEGER DEFAULT 1,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // Employer Requisitions (MERF) table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employer_requisitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requisitionNumber TEXT UNIQUE NOT NULL,
      employerId INTEGER NOT NULL,
      templateId INTEGER,
      title TEXT NOT NULL,
      titleHe TEXT, -- Hebrew title
      description TEXT,
      descriptionHe TEXT, -- Hebrew description
      jobCategory TEXT NOT NULL,
      specificTrade TEXT,
      numberOfWorkers INTEGER NOT NULL DEFAULT 1,
      experienceRequired TEXT,
      qualifications TEXT, -- JSON array stored as text
      languagesRequired TEXT, -- JSON array stored as text
      salaryRange TEXT,
      workLocation TEXT,
      workLocationHe TEXT, -- Hebrew location
      startDate DATE,
      contractDuration TEXT,
      accommodationProvided INTEGER DEFAULT 0,
      accommodationDetails TEXT,
      transportationProvided INTEGER DEFAULT 0,
      otherBenefits TEXT,
      otherBenefitsHe TEXT, -- Hebrew benefits
      complianceChecked INTEGER DEFAULT 0,
      complianceFlags TEXT DEFAULT '[]', -- JSON array stored as text
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'active', 'completed')),
      language TEXT DEFAULT 'en',
      submittedAt DATETIME,
      approvedAt DATETIME,
      approvedBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employerId) REFERENCES users(id),
      FOREIGN KEY (templateId) REFERENCES merf_templates(id),
      FOREIGN KEY (approvedBy) REFERENCES users(id)
    )
  `);

  // Compliance Flags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS compliance_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requisitionId INTEGER NOT NULL,
      flagType TEXT NOT NULL, -- 'minimum_wage', 'max_hours', 'overtime', 'discrimination', etc.
      severity TEXT DEFAULT 'warning' CHECK(severity IN ('info', 'warning', 'critical')),
      message TEXT NOT NULL,
      messageHe TEXT, -- Hebrew message
      field TEXT, -- Field that triggered the flag
      value TEXT, -- Value that caused the flag
      resolved INTEGER DEFAULT 0,
      resolvedAt DATETIME,
      resolvedBy INTEGER,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requisitionId) REFERENCES employer_requisitions(id),
      FOREIGN KEY (resolvedBy) REFERENCES users(id)
    )
  `);

  // Worker Locations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workerId INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      altitude REAL,
      heading REAL,
      speed REAL,
      address TEXT,
      city TEXT,
      country TEXT,
      timestamp DATETIME NOT NULL,
      source TEXT DEFAULT 'gps', -- 'gps', 'network', 'manual'
      batteryLevel INTEGER,
      isCharging INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workerId) REFERENCES users(id)
    )
  `);

  // Geo-fences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS geo_fences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      centerLatitude REAL NOT NULL,
      centerLongitude REAL NOT NULL,
      radius REAL NOT NULL, -- in meters
      type TEXT DEFAULT 'work_site', -- 'work_site', 'accommodation', 'safe_zone', 'restricted'
      active INTEGER DEFAULT 1,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // Geo-fence violations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS geo_fence_violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workerId INTEGER NOT NULL,
      geoFenceId INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      distance REAL, -- distance from fence center in meters
      violationType TEXT DEFAULT 'exit', -- 'exit', 'entry', 'proximity'
      severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'critical'
      resolved INTEGER DEFAULT 0,
      resolvedAt DATETIME,
      resolvedBy INTEGER,
      notes TEXT,
      timestamp DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workerId) REFERENCES users(id),
      FOREIGN KEY (geoFenceId) REFERENCES geo_fences(id),
      FOREIGN KEY (resolvedBy) REFERENCES users(id)
    )
  `);

  // Location history table (for tracking movement patterns)
  db.exec(`
    CREATE TABLE IF NOT EXISTS location_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workerId INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      timestamp DATETIME NOT NULL,
      source TEXT DEFAULT 'gps',
      eventType TEXT DEFAULT 'update', -- 'update', 'checkin', 'emergency'
      metadata TEXT DEFAULT '{}', -- JSON object
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workerId) REFERENCES users(id)
    )
  `);

  // CRM Notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crm_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidateId INTEGER,
      applicationId INTEGER,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]', -- JSON array stored as text
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidateId) REFERENCES users(id),
      FOREIGN KEY (applicationId) REFERENCES applications(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // CRM Activities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS crm_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidateId INTEGER,
      applicationId INTEGER,
      type TEXT NOT NULL,
      description TEXT,
      details TEXT,
      metadata TEXT DEFAULT '{}', -- JSON object stored as text
      userId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidateId) REFERENCES users(id),
      FOREIGN KEY (applicationId) REFERENCES applications(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Interview Assessments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS interview_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId INTEGER NOT NULL,
      interviewerId INTEGER NOT NULL,
      interviewDate DATE,
      interviewDuration INTEGER,
      interviewType TEXT CHECK(interviewType IN ('video', 'phone', 'in-person')),
      interviewLocation TEXT,
      technicalKnowledge INTEGER DEFAULT 0,
      technicalKnowledgeNotes TEXT,
      experienceRelevance INTEGER DEFAULT 0,
      experienceRelevanceNotes TEXT,
      qualifications INTEGER DEFAULT 0,
      qualificationsNotes TEXT,
      communicationSkills INTEGER DEFAULT 0,
      communicationSkillsNotes TEXT,
      languageProficiency INTEGER DEFAULT 0,
      languageProficiencyNotes TEXT,
      problemSolving INTEGER DEFAULT 0,
      problemSolvingNotes TEXT,
      adaptability INTEGER DEFAULT 0,
      adaptabilityNotes TEXT,
      overallImpression INTEGER DEFAULT 0,
      overallImpressionNotes TEXT,
      recommendation TEXT NOT NULL CHECK(recommendation IN ('strongly_recommend', 'recommend', 'consider', 'not_recommend')),
      recommendationNotes TEXT,
      strengths TEXT,
      weaknesses TEXT,
      additionalNotes TEXT,
      totalScore INTEGER DEFAULT 0,
      submittedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicationId) REFERENCES applications(id),
      FOREIGN KEY (interviewerId) REFERENCES users(id)
    )
  `);

  // App settings (e.g. default_from_email) - admin-editable
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // WhatsApp send log (Interakt) - for admin dashboard
  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      phoneMasked TEXT NOT NULL,
      success INTEGER NOT NULL,
      messageId TEXT,
      errorDetail TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Email send log - for admin dashboard (like whatsapp_log)
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      toAddress TEXT NOT NULL,
      fromAddress TEXT NOT NULL,
      success INTEGER NOT NULL,
      messageId TEXT,
      errorDetail TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agent handoff: user requested "speak to human", agent can join and chat
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_handoffs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      agentUserId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      joinedAt DATETIME,
      FOREIGN KEY (agentUserId) REFERENCES users(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_whatsapp_log_createdAt ON whatsapp_log(createdAt);
    CREATE INDEX IF NOT EXISTS idx_whatsapp_log_type ON whatsapp_log(type);
    CREATE INDEX IF NOT EXISTS idx_whatsapp_log_success ON whatsapp_log(success);
    CREATE INDEX IF NOT EXISTS idx_email_log_createdAt ON email_log(createdAt);
    CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_log(type);
    CREATE INDEX IF NOT EXISTS idx_email_log_success ON email_log(success);
    CREATE INDEX IF NOT EXISTS idx_agent_handoffs_sessionId ON agent_handoffs(sessionId);
    CREATE INDEX IF NOT EXISTS idx_agent_handoffs_status ON agent_handoffs(status);
    CREATE INDEX IF NOT EXISTS idx_agent_chat_messages_sessionId ON agent_chat_messages(sessionId);
    CREATE INDEX IF NOT EXISTS idx_agent_chat_messages_createdAt ON agent_chat_messages(createdAt);
    CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_applications_userId ON applications(userId);
    CREATE INDEX IF NOT EXISTS idx_applications_jobId ON applications(jobId);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_merf_templates_category ON merf_templates(category);
    CREATE INDEX IF NOT EXISTS idx_merf_templates_active ON merf_templates(isActive);
    CREATE INDEX IF NOT EXISTS idx_employer_requisitions_employerId ON employer_requisitions(employerId);
    CREATE INDEX IF NOT EXISTS idx_employer_requisitions_status ON employer_requisitions(status);
    CREATE INDEX IF NOT EXISTS idx_employer_requisitions_jobCategory ON employer_requisitions(jobCategory);
    CREATE INDEX IF NOT EXISTS idx_compliance_flags_requisitionId ON compliance_flags(requisitionId);
    CREATE INDEX IF NOT EXISTS idx_compliance_flags_resolved ON compliance_flags(resolved);
    CREATE INDEX IF NOT EXISTS idx_interview_assessments_applicationId ON interview_assessments(applicationId);
    CREATE INDEX IF NOT EXISTS idx_interview_assessments_interviewerId ON interview_assessments(interviewerId);
    CREATE INDEX IF NOT EXISTS idx_interview_assessments_recommendation ON interview_assessments(recommendation);
    CREATE INDEX IF NOT EXISTS idx_crm_notes_candidateId ON crm_notes(candidateId);
    CREATE INDEX IF NOT EXISTS idx_crm_notes_applicationId ON crm_notes(applicationId);
    CREATE INDEX IF NOT EXISTS idx_crm_activities_candidateId ON crm_activities(candidateId);
    CREATE INDEX IF NOT EXISTS idx_crm_activities_applicationId ON crm_activities(applicationId);
    CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(type);
    CREATE INDEX IF NOT EXISTS idx_worker_locations_workerId ON worker_locations(workerId);
    CREATE INDEX IF NOT EXISTS idx_worker_locations_timestamp ON worker_locations(timestamp);
    CREATE INDEX IF NOT EXISTS idx_geo_fences_active ON geo_fences(active);
    CREATE INDEX IF NOT EXISTS idx_geo_fence_violations_workerId ON geo_fence_violations(workerId);
    CREATE INDEX IF NOT EXISTS idx_geo_fence_violations_geoFenceId ON geo_fence_violations(geoFenceId);
    CREATE INDEX IF NOT EXISTS idx_geo_fence_violations_resolved ON geo_fence_violations(resolved);
    CREATE INDEX IF NOT EXISTS idx_location_history_workerId ON location_history(workerId);
    CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON location_history(timestamp);
  `);

  // Add demo account columns to users if missing (migration)
  try {
    db.exec('ALTER TABLE users ADD COLUMN is_demo_account INTEGER DEFAULT 0');
  } catch (e) {
    if (!/duplicate column name/i.test(e.message)) throw e;
  }
  try {
    db.exec('ALTER TABLE users ADD COLUMN demo_password TEXT');
  } catch (e) {
    if (!/duplicate column name/i.test(e.message)) throw e;
  }
  // Agent handoff user info (name, mobile, email)
  try {
    db.exec('ALTER TABLE agent_handoffs ADD COLUMN userName TEXT');
  } catch (e) {
    if (!/duplicate column name/i.test(e.message)) throw e;
  }
  try {
    db.exec('ALTER TABLE agent_handoffs ADD COLUMN userMobile TEXT');
  } catch (e) {
    if (!/duplicate column name/i.test(e.message)) throw e;
  }
  try {
    db.exec('ALTER TABLE agent_handoffs ADD COLUMN userEmail TEXT');
  } catch (e) {
    if (!/duplicate column name/i.test(e.message)) throw e;
  }
  console.log('✅ Database initialized successfully');
}

// Initialize on module load
initializeDatabase();

function getSetting(key) {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO app_settings (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP
  `).run(key, value);
}

module.exports = db;
module.exports.getSetting = getSetting;
module.exports.setSetting = setSetting;
