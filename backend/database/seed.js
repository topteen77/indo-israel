const db = require('./db');
const bcrypt = require('bcryptjs');

// Clear existing data (optional - comment out if you want to keep existing data)
function clearData() {
  db.exec(`
    DELETE FROM applications;
    DELETE FROM jobs;
    DELETE FROM users;
  `);
  console.log('🗑️  Cleared existing data');
}

// Seed users
function seedUsers() {
  const users = [
    {
      email: 'admin@apravas.com',
      password: bcrypt.hashSync('admin123', 10),
      name: 'Apravas Admin',
      fullName: 'Apravas Admin',
      role: 'admin',
      phone: '+91-9876543210',
      address: 'Mumbai, India',
      is_demo_account: 1,
      demo_password: null,
    },
    {
      email: 'employer@israel.com',
      password: bcrypt.hashSync('employer123', 10),
      name: 'Israeli Employer',
      fullName: 'David Cohen',
      role: 'employer',
      companyName: 'Tech Solutions Israel',
      phone: '+972-50-1234567',
      address: 'Tel Aviv, Israel',
      is_demo_account: 1,
      demo_password: null
    },
    {
      email: 'worker@india.com',
      password: bcrypt.hashSync('worker123', 10),
      name: 'Rajesh Kumar',
      fullName: 'Rajesh Kumar',
      role: 'worker',
      phone: '+91-9876543211',
      address: 'Delhi, India',
      is_demo_account: 1,
      demo_password: null
    },
    // Additional dummy users
    {
      email: 'employer2@israel.com',
      password: bcrypt.hashSync('employer123', 10),
      name: 'Sarah Levy',
      fullName: 'Sarah Levy',
      role: 'employer',
      companyName: 'Construction Group Ltd',
      phone: '+972-50-2345678',
      address: 'Jerusalem, Israel',
      is_demo_account: 1,
      demo_password: null
    },
    {
      email: 'worker2@india.com',
      password: bcrypt.hashSync('worker123', 10),
      name: 'Amit Sharma',
      fullName: 'Amit Sharma',
      role: 'worker',
      phone: '+91-9876543212',
      address: 'Pune, India',
      is_demo_account: 1,
      demo_password: null
    },
    {
      email: 'worker3@india.com',
      password: bcrypt.hashSync('worker123', 10),
      name: 'Priya Patel',
      fullName: 'Priya Patel',
      role: 'worker',
      phone: '+91-9876543213',
      address: 'Ahmedabad, India',
      is_demo_account: 1,
      demo_password: null
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (email, password, name, fullName, role, companyName, phone, address, is_demo_account, demo_password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((users) => {
    for (const user of users) {
      insertUser.run(
        user.email,
        user.password,
        user.name,
        user.fullName,
        user.role,
        user.companyName || null,
        user.phone,
        user.address,
        user.is_demo_account || 0,
        user.demo_password || null
      );
    }
  });

  insertMany(users);
  console.log(`✅ Seeded ${users.length} users`);
}

const DEFAULT_ADMIN_EMAIL = 'admin@apravas.com';

/**
 * If the DB has users but no admin@apravas.com (e.g. init-db skipped full seed),
 * insert the default admin so production login works. Safe to run on every startup.
 */
function ensureAdminUser() {
  const existing = db.prepare('SELECT id, is_demo_account FROM users WHERE email = ?').get(DEFAULT_ADMIN_EMAIL);
  if (!existing) {
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, name, fullName, role, companyName, phone, address, is_demo_account, demo_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      DEFAULT_ADMIN_EMAIL,
      bcrypt.hashSync('admin123', 10),
      'Apravas Admin',
      'Apravas Admin',
      'admin',
      null,
      '+91-9876543210',
      'Mumbai, India',
      1,
      null
    );
    console.log(`✅ Created missing default admin (${DEFAULT_ADMIN_EMAIL})`);
    return;
  }
  // Demo cards on /login come from is_demo_account=1 only (see GET /auth/login-credentials)
  if (existing.is_demo_account !== 1) {
    db.prepare('UPDATE users SET is_demo_account = 1, demo_password = NULL WHERE email = ?').run(DEFAULT_ADMIN_EMAIL);
    console.log(`✅ Default admin is now included in demo accounts on the login page (${DEFAULT_ADMIN_EMAIL})`);
  }
}

// Seed login page settings (nav label + test credentials) if not set
function seedLoginPageSettings() {
  if (!db.getSetting('nav_login_label')) {
    db.setSetting('nav_login_label', 'Login');
    console.log('✅ Set default nav_login_label');
  }
}

// Seed jobs
function seedJobs() {
  const categories = [
    'Construction', 'Healthcare', 'Agriculture', 'Hospitality', 
    'IT Support', 'Nursing', 'Driver', 'Security', 'Cleaning', 'Cooking/Chef',
    'Plumber', 'Electrician', 'Carpenter', 'Welder'
  ];

  const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Netanya', 'Ashdod', 'Rishon LeZion', 'Beer Sheva'];
  const companies = [
    'Construction Group Ltd', 'BuildCorp Israel', 'Israel Construction Co',
    'Premium Builders', 'Southern Construction', 'Tech Solutions Israel',
    'Healthcare Partners', 'AgriTech Israel', 'Hospitality Plus',
    'SecureGuard Services', 'CleanPro Solutions', 'Chef Express', 'DriveSafe Logistics'
  ];

  const salaryRanges = [
    { min: 70000, max: 100000 },
    { min: 80000, max: 120000 },
    { min: 100000, max: 150000 },
    { min: 120000, max: 180000 }
  ];

  const experienceLevels = [
    '0-2 years', '1-3 years', '2-5 years', '3-7 years', '5-10 years', '7+ years'
  ];

  const insertJob = db.prepare(`
    INSERT INTO jobs (title, company, location, salary, experience, type, description, requirements, category, openings, status, postedBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) {
      insertJob.run(
        job.title,
        job.company,
        job.location,
        job.salary,
        job.experience,
        job.type,
        job.description,
        job.requirements,
        job.category,
        job.openings,
        job.status,
        job.postedBy
      );
    }
  });

  const jobs = [];
  let jobId = 1;

  // Get employer user IDs
  const employerIds = db.prepare('SELECT id FROM users WHERE role = ?').all('employer').map(u => u.id);
  if (employerIds.length === 0) {
    console.error('❌ No employer users found. Please seed users first.');
    return;
  }

  // Generate jobs for each category
  categories.forEach((category, catIndex) => {
    for (let i = 0; i < 8; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const salaryRange = salaryRanges[Math.floor(Math.random() * salaryRanges.length)];
      const experience = experienceLevels[Math.floor(Math.random() * experienceLevels.length)];
      const openings = Math.floor(Math.random() * 15) + 3;
      const postedBy = employerIds[Math.floor(Math.random() * employerIds.length)];

      const jobTitles = {
        'Construction': ['Construction Worker', 'Site Supervisor', 'Construction Manager', 'Mason', 'Concrete Worker'],
        'Healthcare': ['Healthcare Assistant', 'Nursing Aide', 'Medical Assistant', 'Caregiver', 'Health Worker'],
        'Agriculture': ['Farm Worker', 'Agricultural Technician', 'Harvest Worker', 'Farm Supervisor', 'Crop Specialist'],
        'Hospitality': ['Hotel Staff', 'Restaurant Worker', 'Housekeeping', 'Kitchen Assistant', 'Service Staff'],
        'IT Support': ['IT Support Technician', 'Help Desk Support', 'Technical Support', 'IT Assistant', 'System Support'],
        'Nursing': ['Registered Nurse', 'Nursing Assistant', 'Nurse Practitioner', 'Staff Nurse', 'Nursing Aide'],
        'Driver': ['Delivery Driver', 'Truck Driver', 'Bus Driver', 'Taxi Driver', 'Commercial Driver', 'Heavy Vehicle Driver'],
        'Security': ['Security Guard', 'Security Officer', 'Security Supervisor', 'Security Personnel', 'Security Staff'],
        'Cleaning': ['Housekeeper', 'Janitor', 'Cleaning Staff', 'Maintenance Cleaner', 'Office Cleaner', 'Commercial Cleaner'],
        'Cooking/Chef': ['Chef', 'Cook', 'Kitchen Staff', 'Line Cook', 'Sous Chef', 'Head Chef', 'Pastry Chef'],
        'Plumber': ['Plumber', 'Plumbing Technician', 'Pipe Fitter', 'Plumbing Supervisor', 'Maintenance Plumber'],
        'Electrician': ['Electrician', 'Electrical Technician', 'Electrical Supervisor', 'Maintenance Electrician', 'Wireman'],
        'Carpenter': ['Carpenter', 'Cabinet Maker', 'Furniture Maker', 'Carpentry Supervisor', 'Woodworker'],
        'Welder': ['Welder', 'Welding Technician', 'Fabricator', 'Welding Supervisor', 'Metal Worker']
      };

      const titles = jobTitles[category] || [`${category} Worker`];
      const title = titles[Math.floor(Math.random() * titles.length)];

      const requirements = JSON.stringify([
        'Minimum 2 years experience',
        'Valid work permit',
        'Physical fitness certificate',
        'Relevant certifications'
      ]);

      jobs.push({
        title: `${title} - ${city}`,
        company,
        location: `${city}, Israel`,
        salary: `₹${salaryRange.min.toLocaleString()} - ₹${salaryRange.max.toLocaleString()}`,
        experience,
        type: 'Full-time',
        description: `We are looking for experienced ${title.toLowerCase()} to join our team in ${city}. Must have relevant experience and certifications. Competitive salary and benefits package.`,
        requirements,
        category,
        openings,
        status: 'active',
        postedBy
      });
    }
  });

  insertMany(jobs);
  console.log(`✅ Seeded ${jobs.length} jobs`);
}

// Seed applications (optional - for testing)
function seedApplications() {
  const workerIds = db.prepare('SELECT id FROM users WHERE role = ?').all('worker').map(u => u.id);
  const jobIds = db.prepare('SELECT id FROM jobs LIMIT 10').all().map(j => j.id);

  if (workerIds.length === 0 || jobIds.length === 0) {
    console.log('⚠️  Skipping applications seed - insufficient data');
    return;
  }

  const applications = [
    {
      submissionId: 'ISR-1706000000000-ABC123',
      userId: workerIds[0],
      jobId: jobIds[0],
      fullName: 'Rajesh Kumar',
      dateOfBirth: '1990-06-15',
      gender: 'male',
      maritalStatus: 'married',
      mobileNumber: '9876543210',
      email: 'rajesh.kumar@example.com',
      permanentAddress: '123 Main Street, New Delhi, Delhi 110001, India',
      hasPassport: 'yes',
      passportNumber: 'A12345678',
      passportIssuePlace: 'New Delhi',
      passportIssueDate: '2020-01-15',
      passportExpiryDate: '2030-01-15',
      jobCategory: 'construction',
      specificTrade: 'Carpenter',
      experienceYears: '8',
      workedAbroad: 'yes',
      countriesWorked: 'UAE, Saudi Arabia',
      hasCertificate: 'yes',
      certificateDetails: 'ITI Certificate in Carpentry, Safety Training Certificate',
      canReadDrawings: 'yes',
      languages: JSON.stringify(['hindi', 'english', 'arabic']),
      medicalCondition: 'no',
      medicalDetails: '',
      criminalCase: 'no',
      criminalDetails: '',
      declaration: 1,
      digitalSignature: '',
      autoScore: 85,
      routing: JSON.stringify({ route: 'employer_sponsored', priority: 'high' }),
      status: 'under_review',
      language: 'en',
      files: JSON.stringify({ passportFiles: [], certificateFiles: [], workPhotos: [] })
    }
  ];

  const insertApp = db.prepare(`
    INSERT INTO applications (
      submissionId, userId, jobId, fullName, dateOfBirth, gender, maritalStatus,
      mobileNumber, email, permanentAddress, hasPassport, passportNumber,
      passportIssuePlace, passportIssueDate, passportExpiryDate, jobCategory,
      specificTrade, experienceYears, workedAbroad, countriesWorked,
      hasCertificate, certificateDetails, canReadDrawings, languages,
      medicalCondition, medicalDetails, criminalCase, criminalDetails,
      declaration, digitalSignature, autoScore, routing, status, language, files
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((apps) => {
    for (const app of apps) {
      insertApp.run(
        app.submissionId, app.userId, app.jobId, app.fullName, app.dateOfBirth,
        app.gender, app.maritalStatus, app.mobileNumber, app.email, app.permanentAddress,
        app.hasPassport, app.passportNumber, app.passportIssuePlace, app.passportIssueDate,
        app.passportExpiryDate, app.jobCategory, app.specificTrade, app.experienceYears,
        app.workedAbroad, app.countriesWorked, app.hasCertificate, app.certificateDetails,
        app.canReadDrawings, app.languages, app.medicalCondition, app.medicalDetails,
        app.criminalCase, app.criminalDetails, app.declaration, app.digitalSignature,
        app.autoScore, app.routing, app.status, app.language, app.files
      );
    }
  });

  insertMany(applications);
  console.log(`✅ Seeded ${applications.length} applications`);
}

/** Demo GPS for Rajesh (worker@india.com) — Sector 17, Chandigarh (latest worker_locations row wins). */
function seedDemoWorkerLocations() {
  const row = db.prepare("SELECT id FROM users WHERE email = ? AND role = 'worker'").get('worker@india.com');
  if (!row) {
    console.log('⚠️  Demo worker worker@india.com not found — skipping demo GPS seed');
    return;
  }
  const ts = new Date().toISOString();
  const lat = 30.7415;
  const lng = 76.7684;
  db.prepare(`
    INSERT INTO worker_locations (
      workerId, latitude, longitude, accuracy, altitude, heading, speed,
      address, city, country, timestamp, source, batteryLevel, isCharging
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.id,
    lat,
    lng,
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
  db.prepare('UPDATE users SET address = ? WHERE id = ?').run('Sector 17, Chandigarh, India', row.id);
  console.log('✅ Seeded demo GPS: Rajesh → Sector 17, Chandigarh');
}

// Seed jobs for specific categories only (without clearing existing data)
function seedJobsForCategories(categoriesToSeed) {
  const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Netanya', 'Ashdod', 'Rishon LeZion', 'Beer Sheva'];
  const companies = [
    'Construction Group Ltd', 'BuildCorp Israel', 'Israel Construction Co',
    'Premium Builders', 'Southern Construction', 'Tech Solutions Israel',
    'Healthcare Partners', 'AgriTech Israel', 'Hospitality Plus',
    'SecureGuard Services', 'CleanPro Solutions', 'Chef Express', 'DriveSafe Logistics'
  ];

  const salaryRanges = [
    { min: 70000, max: 100000 },
    { min: 80000, max: 120000 },
    { min: 100000, max: 150000 },
    { min: 120000, max: 180000 }
  ];

  const experienceLevels = [
    '0-2 years', '1-3 years', '2-5 years', '3-7 years', '5-10 years', '7+ years'
  ];

  const insertJob = db.prepare(`
    INSERT INTO jobs (title, company, location, salary, experience, type, description, requirements, category, openings, status, postedBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) {
      insertJob.run(
        job.title,
        job.company,
        job.location,
        job.salary,
        job.experience,
        job.type,
        job.description,
        job.requirements,
        job.category,
        job.openings,
        job.status,
        job.postedBy
      );
    }
  });

  const jobs = [];

  // Get employer user IDs
  const employerIds = db.prepare('SELECT id FROM users WHERE role = ?').all('employer').map(u => u.id);
  if (employerIds.length === 0) {
    console.error('❌ No employer users found. Please seed users first.');
    return;
  }

  const jobTitles = {
    'Driver': ['Delivery Driver', 'Truck Driver', 'Bus Driver', 'Taxi Driver', 'Commercial Driver', 'Heavy Vehicle Driver'],
    'Security': ['Security Guard', 'Security Officer', 'Security Supervisor', 'Security Personnel', 'Security Staff'],
    'Cleaning': ['Housekeeper', 'Janitor', 'Cleaning Staff', 'Maintenance Cleaner', 'Office Cleaner', 'Commercial Cleaner'],
    'Cooking/Chef': ['Chef', 'Cook', 'Kitchen Staff', 'Line Cook', 'Sous Chef', 'Head Chef', 'Pastry Chef'],
  };

  // Generate jobs for each specified category
  categoriesToSeed.forEach((category) => {
    for (let i = 0; i < 8; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const salaryRange = salaryRanges[Math.floor(Math.random() * salaryRanges.length)];
      const experience = experienceLevels[Math.floor(Math.random() * experienceLevels.length)];
      const openings = Math.floor(Math.random() * 15) + 3;
      const postedBy = employerIds[Math.floor(Math.random() * employerIds.length)];

      const titles = jobTitles[category] || [`${category} Worker`];
      const title = titles[Math.floor(Math.random() * titles.length)];

      const requirements = JSON.stringify([
        'Minimum 2 years experience',
        'Valid work permit',
        'Physical fitness certificate',
        'Relevant certifications'
      ]);

      jobs.push({
        title: `${title} - ${city}`,
        company,
        location: `${city}, Israel`,
        salary: `₹${salaryRange.min.toLocaleString()} - ₹${salaryRange.max.toLocaleString()}`,
        experience,
        type: 'Full-time',
        description: `We are looking for experienced ${title.toLowerCase()} to join our team in ${city}. Must have relevant experience and certifications. Competitive salary and benefits package.`,
        requirements,
        category,
        openings,
        status: 'active',
        postedBy
      });
    }
  });

  insertMany(jobs);
  console.log(`✅ Seeded ${jobs.length} jobs for categories: ${categoriesToSeed.join(', ')}`);
}

// Main seed function
function seed() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    clearData();
    seedUsers();
    seedJobs();
    seedApplications();
    seedDemoWorkerLocations();
    seedLoginPageSettings();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Jobs: ${jobCount}`);
    console.log(`   - Applications: ${appCount}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = {
  seed,
  seedUsers,
  seedJobs,
  seedApplications,
  seedDemoWorkerLocations,
  seedLoginPageSettings,
  seedJobsForCategories,
  ensureAdminUser,
};
