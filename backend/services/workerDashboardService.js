const db = require('../database/db');
const { generateWorkerDashboard: getReferenceWorkerDashboard } = require('./mockData');

/**
 * Parse application row and optionally join job for title/company
 */
function parseApplicationRow(row, job = null) {
  const app = {
    id: row.id,
    submissionId: row.submissionId,
    jobId: row.jobId,
    title: job ? job.title : 'Job',
    company_name: job ? job.company : 'Employer',
    status: row.status || 'submitted',
    applied_at: row.createdAt,
    progress: statusToProgress(row.status),
    current_step: (row.status || 'submitted').replace(/-/g, '_'),
  };
  return app;
}

function statusToProgress(status) {
  const map = {
    submitted: 25,
    under_review: 50,
    approved: 100,
    rejected: 0,
    withdrawn: 0,
  };
  return map[status] ?? 30;
}

/**
 * Build timeline milestones from application status
 */
function buildTimeline(applications, userId) {
  const defaultMilestones = [
    { title: 'Application Submitted', completed: false, completedAt: null, estimatedDate: null },
    { title: 'Document Verification', completed: false, completedAt: null, estimatedDate: null },
    { title: 'Skill Assessment', completed: false, completedAt: null, estimatedDate: null },
    { title: 'Employer Review', completed: false, completedAt: null, estimatedDate: null },
    { title: 'Interview', completed: false, completedAt: null, estimatedDate: null },
    { title: 'Final Approval', completed: false, completedAt: null, estimatedDate: null },
  ];

  const latestApp = applications.length > 0
    ? applications.reduce((a, b) => (new Date(b.createdAt) > new Date(a.createdAt) ? b : a))
    : null;

  let currentStepIndex = 0;
  const statusOrder = ['submitted', 'under_review', 'approved'];
  if (latestApp) {
    const idx = statusOrder.indexOf(latestApp.status);
    currentStepIndex = Math.min(idx >= 0 ? idx + 1 : 1, defaultMilestones.length - 1);
  }

  const overallProgress = applications.length === 0
    ? 0
    : Math.round(
        applications.reduce((sum, a) => sum + statusToProgress(a.status), 0) / applications.length
      );

  return {
    currentStep: latestApp ? latestApp.status.replace(/_/g, ' ') : 'not_started',
    currentStepIndex,
    overallProgress: Math.min(overallProgress, 100),
    milestones: defaultMilestones.map((m, i) => ({
      ...m,
      completed: i < currentStepIndex,
      completedAt: i < currentStepIndex && latestApp ? latestApp.createdAt : null,
      estimatedDate: latestApp ? new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : null,
    })),
  };
}

/**
 * Build documents list from ALL applications' files (aggregate passport, certificates, work photos)
 */
function buildDocumentsFromApplications(appRows) {
  const docTypes = [
    { type: 'passport', name: 'Passport', description: 'Valid passport with minimum 2 years validity', key: 'passportFiles' },
    { type: 'certificate', name: 'Certificates', description: 'Skill or education certificates', key: 'certificateFiles' },
    { type: 'work_photos', name: 'Work Photos', description: 'Photos of previous work', key: 'workPhotos' },
  ];

  const docMap = {}; // key -> { name, status, description, files: [{ url, name, applicationId }] }
  docTypes.forEach((d) => {
    docMap[d.key] = { type: d.type, name: d.name, description: d.description, status: 'missing', files: [] };
  });

  appRows.forEach((row) => {
    let files = {};
    try {
      files = row.files ? (typeof row.files === 'string' ? JSON.parse(row.files) : row.files) : {};
    } catch (_) {}
    docTypes.forEach((d) => {
      const v = files[d.key];
      const hasFiles = Array.isArray(v) ? v.length > 0 : v && (typeof v === 'string' ? v.trim() !== '' : true);
      if (hasFiles) {
        docMap[d.key].status = 'verified';
        const list = Array.isArray(v) ? v : [v];
        list.forEach((f) => {
          if (f && (f.url || f.fileUrl || typeof f === 'string')) {
            docMap[d.key].files.push({
              url: f.url || f.fileUrl || f,
              name: f.name || f.filename || 'Document',
              applicationId: row.id,
            });
          }
        });
      }
    });
  });

  const documents = Object.values(docMap);
  const verified = documents.filter((d) => d.status === 'verified').length;
  const missing = documents.filter((d) => d.status === 'missing').length;

  return {
    total: documents.length,
    verified,
    pending: 0,
    missing,
    rejected: 0,
    documents,
  };
}

/** Legacy: build from single application (for fallback when no apps) */
function buildDocuments(application) {
  const files = application?.files && typeof application.files === 'object' ? application.files : {};
  const hasFiles = (key) => {
    const v = files[key];
    return Array.isArray(v) ? v.length > 0 : v && (typeof v === 'string' ? v.trim() !== '' : true);
  };
  const docTypes = [
    { type: 'passport', name: 'Passport', description: 'Valid passport with minimum 2 years validity', key: 'passportFiles' },
    { type: 'certificate', name: 'Certificates', description: 'Skill or education certificates', key: 'certificateFiles' },
    { type: 'work_photos', name: 'Work Photos', description: 'Photos of previous work', key: 'workPhotos' },
  ];
  let verified = 0, missing = 0;
  const documents = docTypes.map((d) => {
    const status = hasFiles(d.key) ? 'verified' : 'missing';
    if (status === 'verified') verified++; else missing++;
    return { type: d.type, name: d.name, status, description: d.description, files: [] };
  });
  return { total: documents.length, verified, pending: 0, missing, rejected: 0, documents };
}

/**
 * Build skills from latest application
 */
function buildSkills(application) {
  const jobCategory = application?.jobCategory || '';
  const experienceYears = application?.experienceYears ? String(application.experienceYears) : '0';
  let languages = [];
  if (application?.languages) {
    try {
      const raw = typeof application.languages === 'string' ? JSON.parse(application.languages) : application.languages;
      languages = Array.isArray(raw) ? raw : [raw];
    } catch (_) {
      languages = [String(application.languages)];
    }
  }

  const skillsList = [jobCategory].filter(Boolean);
  if (experienceYears && experienceYears !== '0') skillsList.push(`${experienceYears} years experience`);
  skillsList.push(...languages);

  const recommendations = [
    { title: 'TypeScript Fundamentals', provider: 'NSDC', duration: '4 weeks', category: 'Programming', skillPoints: 15, url: '#' },
    { title: 'Safety at Work', provider: 'NSDC', duration: '2 weeks', category: 'Safety', skillPoints: 10, url: '#' },
  ];

  const skillScore = Math.min(100, 50 + (skillsList.length * 8) + (parseInt(experienceYears, 10) || 0) * 2);

  return {
    currentSkills: {
      skills: skillsList.length ? skillsList : ['Not specified'],
      certifications: application?.certificateDetails ? [application.certificateDetails] : [],
      languages,
      experience_years: parseInt(experienceYears, 10) || 0,
      education: null,
    },
    recommendations,
    skillScore: Math.min(100, skillScore),
  };
}

/**
 * Get worker dashboard data from database
 * @param {number|string} userId - Worker user id
 * @returns {Object} Dashboard data in same shape as mock
 */
function getWorkerDashboard(userId) {
  const uid = parseInt(userId, 10);
  if (!uid) {
    return getEmptyDashboard(userId);
  }

  const user = db.prepare(
    'SELECT id, email, name, fullName, role, companyName, phone, address FROM users WHERE id = ? AND role = ?'
  ).get(uid, 'worker');

  if (!user) {
    return getEmptyDashboard(userId);
  }

  // Optional extra profile fields stored as JSON (used for worker self-service profile fields)
  let workerProfileData = {};
  try {
    const row = db.prepare('SELECT profileData FROM worker_profiles WHERE userId = ?').get(uid);
    workerProfileData = row?.profileData ? JSON.parse(row.profileData) : {};
  } catch (_) {
    workerProfileData = {};
  }

  const appRows = db.prepare(
    'SELECT * FROM applications WHERE userId = ? ORDER BY createdAt DESC'
  ).all(uid);

  const latestAppForProfile = appRows[0];
  const experienceYears = latestAppForProfile?.experienceYears ? parseInt(String(latestAppForProfile.experienceYears), 10) : 0;
  const skillsList = [];
  if (latestAppForProfile?.jobCategory) skillsList.push(latestAppForProfile.jobCategory);
  if (latestAppForProfile?.languages) {
    try {
      const lang = typeof latestAppForProfile.languages === 'string'
        ? JSON.parse(latestAppForProfile.languages)
        : latestAppForProfile.languages;
      skillsList.push(...(Array.isArray(lang) ? lang : [lang]));
    } catch (_) {
      skillsList.push(String(latestAppForProfile.languages));
    }
  }

  const profile = {
    id: user.id,
    fullName: user.fullName || user.name || 'Worker',
    email: user.email,
    phone: user.phone || '',
    experience: experienceYears || 0,
    skills: skillsList.length ? skillsList : [],
    location: user.address || '',
    emergencyContactName: workerProfileData.emergencyContactName || '',
    emergencyContactPhone: workerProfileData.emergencyContactPhone || '',
  };

  const jobIds = [...new Set(appRows.map((a) => a.jobId).filter(Boolean))];
  const jobsMap = {};
  if (jobIds.length > 0) {
    const placeholders = jobIds.map(() => '?').join(',');
    const jobs = db.prepare(`SELECT id, title, company FROM jobs WHERE id IN (${placeholders})`).all(...jobIds);
    jobs.forEach((j) => { jobsMap[j.id] = j; });
  }

  const applicationsList = appRows.map((row) => parseApplicationRow(row, jobsMap[row.jobId] || null));

  const approved = applicationsList.filter((a) => a.status === 'approved').length;
  const rejected = applicationsList.filter((a) => a.status === 'rejected').length;
  const active = applicationsList.filter((a) => a.status !== 'rejected' && a.status !== 'withdrawn').length;

  const applications = {
    total: applicationsList.length,
    active,
    approved,
    rejected,
    applications: applicationsList,
  };

  const latestApp = appRows[0] ? {
    ...appRows[0],
    files: appRows[0].files ? JSON.parse(appRows[0].files) : {},
  } : null;

  // Documents: aggregate from ALL applications (stored and shown in Documents tab)
  let documents = appRows.length > 0
    ? buildDocumentsFromApplications(appRows)
    : buildDocuments(null);

  // Timeline: from DB when apps exist; use sample data when no applications
  let timeline = buildTimeline(appRows, uid);
  if (applicationsList.length === 0) {
    const ref = getReferenceWorkerDashboard(String(uid));
    timeline = ref.timeline;
  }

  let skills = buildSkills(latestApp);
  let notifications = [];
  if (appRows.length > 0) {
    const lastApp = appRows[0];
    notifications.push({
      id: 'app-1',
      title: 'Application Status',
      message: `Your application is ${lastApp.status.replace(/_/g, ' ')}.`,
      priority: 'medium',
      timestamp: new Date(lastApp.updatedAt || lastApp.createdAt).toISOString(),
    });
  }

  // When no applications: My Applications stays empty (only dynamic); documents/timeline use sample
  if (applicationsList.length === 0) {
    const ref = getReferenceWorkerDashboard(String(uid));
    documents = ref.documents;
    skills = ref.skills;
    notifications = ref.notifications || [];
  }

  return {
    profile,
    applications,
    documents,
    timeline,
    skills,
    notifications,
    resources: [
      { title: 'Visa Application Guide', type: 'guide', url: '#' },
      { title: 'Interview Preparation Tips', type: 'article', url: '#' },
    ],
    workerId: String(user.id),
  };
}

function getEmptyDashboard(userId) {
  const ref = getReferenceWorkerDashboard(String(userId || '1'));
  return {
    profile: { ...ref.profile, id: userId, fullName: ref.profile.fullName, email: ref.profile.email },
    applications: ref.applications,
    documents: ref.documents,
    timeline: ref.timeline,
    skills: ref.skills,
    notifications: ref.notifications || [],
    resources: ref.resources || [
      { title: 'Visa Application Guide', type: 'guide', url: '#' },
      { title: 'Interview Preparation Tips', type: 'article', url: '#' },
    ],
    workerId: String(userId),
  };
}

module.exports = { getWorkerDashboard };
