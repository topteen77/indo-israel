/**
 * One-off / demo: set Rajesh Kumar (worker@india.com) current GPS to Sector 17, Chandigarh.
 * Latest row in worker_locations wins (see enhancedLocationService.getCurrentLocation).
 */
const path = require('path');
const db = require(path.join(__dirname, '..', 'database', 'db'));

const DEMO_WORKER_EMAIL = 'worker@india.com';
// Sector 17 commercial area, Chandigarh (~center)
const LAT = 30.7415;
const LNG = 76.7684;

function run() {
  const user = db.prepare('SELECT id, fullName FROM users WHERE email = ?').get(DEMO_WORKER_EMAIL);
  if (!user) {
    console.error(`No user with email ${DEMO_WORKER_EMAIL}`);
    process.exit(1);
  }

  const ts = new Date().toISOString();
  db.prepare(`
    INSERT INTO worker_locations (
      workerId, latitude, longitude, accuracy, altitude, heading, speed,
      address, city, country, timestamp, source, batteryLevel, isCharging
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    LAT,
    LNG,
    25,
    null,
    null,
    null,
    'Sector 17, Chandigarh, India',
    'Chandigarh',
    'India',
    ts,
    'manual',
    82,
    0
  );

  db.prepare('UPDATE users SET address = ? WHERE id = ?').run('Sector 17, Chandigarh, India', user.id);

  console.log(`OK — ${user.fullName || 'Worker'} (id ${user.id}): Sector 17, Chandigarh @ ${LAT}, ${LNG}`);
}

run();
