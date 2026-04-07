const db = require('../database/db');
const enhancedLocationService = require('./enhancedLocationService');

function hoursSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

function formatRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day(s) ago`;
}

/**
 * Map pins: prefer latest worker_locations row; otherwise use most recent history point
 * (history can exist without a current row).
 */
function buildWorkerLocationForMap(loc, history) {
  if (loc && loc.latitude != null && loc.longitude != null) {
    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: loc.address,
      city: loc.city,
      country: loc.country,
      timestamp: loc.timestamp,
    };
  }
  const h = history && history[0];
  if (h && h.latitude != null && h.longitude != null) {
    return {
      latitude: h.latitude,
      longitude: h.longitude,
      address: null,
      city: null,
      country: null,
      timestamp: h.timestamp,
    };
  }
  return null;
}

function deriveStatus(loc, history) {
  const emergencyRecent = history.some((h) => {
    if (h.eventType !== 'emergency') return false;
    if (h.metadata?.resolved) return false;
    return hoursSince(h.timestamp) < 24 * 7;
  });
  if (emergencyRecent) {
    return { current: 'critical', message: 'Emergency event on record' };
  }

  const lastTs = loc?.timestamp || history[0]?.timestamp;
  const h = hoursSince(lastTs);

  if (lastTs === undefined || lastTs === Infinity) {
    return { current: 'warning', message: 'No location data yet' };
  }
  if (h > 48) {
    return { current: 'critical', message: 'No location update for over 48 hours' };
  }
  if (h > 4) {
    return { current: 'warning', message: 'Delayed check-in (> 4 hours)' };
  }
  return { current: 'safe', message: 'All systems normal' };
}

function emptyIncidents() {
  return [
    {
      id: 'all-clear',
      title: 'All clear',
      subtitle: 'No incidents recorded for your workforce in the selected period.',
      when: '',
      variant: 'neutral',
    },
  ];
}

/**
 * Safety & welfare summary for an employer: applicants on their jobs + live location when worker user is linked.
 * @param {number} employerUserId
 */
function getEmployerSafetySummary(employerUserId) {
  const uid = parseInt(employerUserId, 10);
  if (!uid) {
    return {
      companyName: 'Company',
      workers: [],
      stats: { total: 0, activeSafe: 0, offline: 0, sos: 0 },
      emergencies: [],
      recentIncidents: emptyIncidents(),
      welfare: { completed: 0, avgScore: 0, satisfactionPct: 0 },
    };
  }

  const employer = db
    .prepare('SELECT id, companyName, fullName, name, email FROM users WHERE id = ? AND role = ?')
    .get(uid, 'employer');

  if (!employer) {
    return {
      companyName: 'Company',
      workers: [],
      stats: { total: 0, activeSafe: 0, offline: 0, sos: 0 },
      emergencies: [],
      recentIncidents: emptyIncidents(),
      welfare: { completed: 0, avgScore: 0, satisfactionPct: 0 },
    };
  }

  const companyName = employer.companyName || employer.fullName || employer.name || 'Company';

  const jobRows = db.prepare('SELECT id, title, company, location FROM jobs WHERE postedBy = ?').all(uid);
  const jobIds = jobRows.map((j) => j.id);

  if (jobIds.length === 0) {
    return {
      companyName,
      workers: [],
      stats: { total: 0, activeSafe: 0, offline: 0, sos: 0 },
      emergencies: [],
      recentIncidents: [
        {
          id: 'no-jobs',
          title: 'No job postings',
          subtitle: 'Post a job to receive applications; linked workers will appear here for GPS and welfare.',
          when: '',
          variant: 'neutral',
        },
      ],
      welfare: { completed: 0, avgScore: 0, satisfactionPct: 0 },
    };
  }

  const placeholders = jobIds.map(() => '?').join(',');
  const apps = db
    .prepare(
      `SELECT a.*, j.title AS jobTitle, j.company AS jobCompany
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE a.jobId IN (${placeholders}) AND (a.status IS NULL OR a.status != 'withdrawn')
       ORDER BY a.updatedAt DESC`
    )
    .all(...jobIds);

  const seenUser = new Set();
  const seenAppOnly = new Set();
  const rows = [];

  for (const app of apps) {
    if (app.userId) {
      const wid = parseInt(app.userId, 10);
      if (!wid || seenUser.has(wid)) continue;
      seenUser.add(wid);
      rows.push({ kind: 'linked', userId: wid, app });
    } else {
      if (seenAppOnly.has(app.id)) continue;
      seenAppOnly.add(app.id);
      rows.push({ kind: 'applicant', userId: null, app });
    }
  }

  const workers = [];
  const workerIdsForEmergencies = [];

  for (const row of rows) {
    const app = row.app;
    const name = app.fullName || 'Applicant';
    const jobTitle = app.jobTitle || app.specificTrade || app.jobCategory || '—';

    if (row.kind === 'applicant') {
      workers.push({
        id: `app-${app.id}`,
        applicationId: app.id,
        userId: null,
        name,
        email: app.email || '',
        phone: app.mobileNumber || '',
        jobTitle,
        employer: companyName,
        status: {
          current: 'warning',
          message: 'Worker account not linked — live GPS unavailable',
        },
        location: null,
        displayLocation: app.permanentAddress || '—',
        city: '',
        country: '—',
        lastSeenLabel: '—',
        batteryPct: null,
        signalLabel: '—',
        hasLiveGps: false,
      });
      continue;
    }

    const userId = row.userId;
    const u = db.prepare('SELECT id, fullName, email, phone, role FROM users WHERE id = ?').get(userId);
    if (!u || u.role !== 'worker') {
      workers.push({
        id: `app-${app.id}-user`,
        applicationId: app.id,
        userId: u?.id || null,
        name,
        email: app.email || '',
        phone: app.mobileNumber || '',
        jobTitle,
        employer: companyName,
        status: {
          current: 'warning',
          message:
            u && u.role !== 'worker'
              ? 'Linked user is not a worker account — GPS unavailable'
              : 'Worker profile not found',
        },
        location: null,
        displayLocation: app.permanentAddress || '—',
        city: '',
        country: '—',
        lastSeenLabel: '—',
        batteryPct: null,
        signalLabel: '—',
        hasLiveGps: false,
      });
      continue;
    }

    workerIdsForEmergencies.push(userId);

    const displayName = u.fullName || name;

    const loc = enhancedLocationService.getCurrentLocation(userId);
    const history = enhancedLocationService.getLocationHistory(userId, { limit: 40 });
    const st = deriveStatus(loc, history);
    const mapLoc = buildWorkerLocationForMap(loc, history);

    const lastTs = loc?.timestamp || history[0]?.timestamp;
    const batteryPct =
      loc?.batteryLevel != null && !Number.isNaN(Number(loc.batteryLevel))
        ? Math.min(100, Math.max(0, Math.round(Number(loc.batteryLevel))))
        : null;

    const signalLabel = st.current === 'safe' ? 'Strong' : st.current === 'warning' ? 'Med' : 'Weak';

    workers.push({
      id: userId,
      applicationId: app.id,
      userId,
      name: displayName,
      email: u.email || app.email || '',
      phone: u.phone || app.mobileNumber || '',
      jobTitle,
      employer: companyName,
      status: st,
      location: mapLoc
        ? {
            latitude: mapLoc.latitude,
            longitude: mapLoc.longitude,
            address: mapLoc.address,
            city: mapLoc.city,
            country: mapLoc.country,
            timestamp: mapLoc.timestamp,
          }
        : null,
      displayLocation: loc?.address || app.permanentAddress || 'Unknown',
      city: loc?.city || mapLoc?.city || '',
      country: loc?.country || mapLoc?.country || '',
      lastSeenLabel: formatRelative(lastTs),
      batteryPct,
      signalLabel,
      hasLiveGps: true,
    });
  }

  const emergencies = [];
  for (const wid of workerIdsForEmergencies) {
    const hist = enhancedLocationService.getLocationHistory(wid, {
      limit: 30,
      eventType: 'emergency',
    });
    const w = workers.find((x) => x.userId === wid);
    for (const h of hist) {
      const meta = h.metadata || {};
      const resolved = !!meta.resolved;
      emergencies.push({
        id: `e-${h.id}`,
        historyId: h.id,
        workerId: wid,
        workerName: w?.name || 'Worker',
        type: 'emergency',
        message: meta.message || 'Emergency assistance needed',
        timestamp: h.timestamp,
        resolved,
        resolvedAt: meta.resolvedAt || null,
        location: w?.location
          ? {
              address: w.location.address,
              city: w.location.city,
              country: w.location.country,
            }
          : null,
        status: resolved ? 'closed' : 'active',
      });
    }
  }

  emergencies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  let activeSafe = 0;
  let offline = 0;
  let criticalWorkers = 0;
  for (const w of workers) {
    const s = w.status?.current;
    if (s === 'safe') activeSafe += 1;
    else if (s === 'warning') offline += 1;
    else if (s === 'critical') criticalWorkers += 1;
  }

  const activeEmergencyCount = emergencies.filter((e) => !e.resolved).length;

  const stats = {
    total: workers.length,
    activeSafe,
    offline,
    sos: activeEmergencyCount > 0 ? activeEmergencyCount : criticalWorkers,
  };

  const recentIncidents = [];

  for (const em of emergencies.filter((e) => !e.resolved)) {
    recentIncidents.push({
      id: em.id,
      historyId: em.historyId,
      title: 'Emergency signal',
      subtitle: `${em.workerName}: ${em.message}`,
      when: formatRelative(em.timestamp),
      variant: 'error',
      canResolve: true,
    });
  }

  let violations = [];
  if (workerIdsForEmergencies.length) {
    const ph = workerIdsForEmergencies.map(() => '?').join(',');
    violations = db
      .prepare(
        `SELECT v.id, v.timestamp, v.resolved, v.notes, v.severity, v.workerId, gf.name AS fenceName
         FROM geo_fence_violations v
         LEFT JOIN geo_fences gf ON v.geoFenceId = gf.id
         WHERE v.workerId IN (${ph})
         ORDER BY v.timestamp DESC
         LIMIT 6`
      )
      .all(...workerIdsForEmergencies);

    for (const v of violations) {
      const wn = workers.find((x) => x.userId === v.workerId)?.name || 'Worker';
      recentIncidents.push({
        id: `vio-${v.id}`,
        title: v.resolved ? 'Geo alert — resolved' : 'Geo-fence alert',
        subtitle: `${wn} — ${v.fenceName || 'Site'}${v.notes ? ` (${v.notes})` : ''}`,
        when: formatRelative(v.timestamp),
        variant: v.resolved ? 'success' : 'warning',
        canResolve: false,
      });
    }
  }

  for (const em of emergencies.filter((e) => e.resolved)) {
    recentIncidents.push({
      id: `${em.id}-resolved`,
      title: 'Emergency — resolved',
      subtitle: `${em.workerName}: ${em.message}`,
      when: formatRelative(em.resolvedAt || em.timestamp),
      variant: 'success',
      canResolve: false,
    });
  }

  if (recentIncidents.length === 0) {
    recentIncidents.push(...emptyIncidents());
  }

  let welfare = { completed: 0, avgScore: 0, satisfactionPct: 0 };
  try {
    const assessPlaceholders = jobIds.map(() => '?').join(',');
    const wRow = db
      .prepare(
        `SELECT COUNT(*) AS cnt, COALESCE(AVG(ia.totalScore), 0) AS avgScore
         FROM interview_assessments ia
         INNER JOIN applications a ON ia.applicationId = a.id
         WHERE a.jobId IN (${assessPlaceholders})`
      )
      .get(...jobIds);
    const interviewCount = wRow?.cnt || 0;
    const avg100 = wRow?.avgScore != null ? Number(wRow.avgScore) : 0;

    const since = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
    let checkinCount = 0;
    for (const wid of workerIdsForEmergencies) {
      const h = enhancedLocationService.getLocationHistory(wid, {
        startDate: since,
        eventType: 'checkin',
        limit: 500,
      });
      checkinCount += h.length;
    }

    welfare = {
      completed: Math.max(interviewCount, checkinCount),
      avgScore: avg100 > 0 ? Math.round((avg100 / 20) * 10) / 10 : 0,
      satisfactionPct: avg100 > 0 ? Math.min(100, Math.round(avg100)) : 0,
    };
  } catch (e) {
    console.error('employer welfare aggregate:', e.message);
  }

  return {
    companyName,
    workers,
    stats,
    emergencies,
    recentIncidents,
    welfare,
  };
}

/**
 * Mark an emergency location_history row as resolved by employer (acknowledge / close alert).
 */
function resolveEmployerEmergency(employerUserId, historyId) {
  const hid = parseInt(historyId, 10);
  const uid = parseInt(employerUserId, 10);
  if (!hid || !uid) {
    return { success: false, message: 'Invalid request', code: 400 };
  }

  const row = db.prepare('SELECT * FROM location_history WHERE id = ?').get(hid);
  if (!row || row.eventType !== 'emergency') {
    return { success: false, message: 'Emergency alert not found', code: 404 };
  }

  const workerId = row.workerId;

  const ok = db
    .prepare(
      `SELECT 1 AS ok FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE j.postedBy = ? AND a.userId = ?
       LIMIT 1`
    )
    .get(uid, workerId);

  if (!ok) {
    return { success: false, message: 'You cannot resolve alerts for workers outside your company', code: 403 };
  }

  let meta = {};
  try {
    meta = row.metadata ? JSON.parse(row.metadata) : {};
  } catch (_) {
    meta = {};
  }
  if (meta.resolved) {
    return { success: false, message: 'This alert is already closed', code: 400 };
  }

  meta.resolved = true;
  meta.resolvedAt = new Date().toISOString();
  meta.resolvedByEmployerId = uid;

  db.prepare('UPDATE location_history SET metadata = ? WHERE id = ?').run(JSON.stringify(meta), hid);

  return { success: true };
}

module.exports = {
  getEmployerSafetySummary,
  resolveEmployerEmergency,
};
