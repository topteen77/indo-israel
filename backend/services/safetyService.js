// Safety & Welfare Check-in Service
// Generates mock data for GPS-enabled safety system

function generateSafetyData(workerId = null, isAdmin = false) {
  if (isAdmin) {
    return generateAdminSafetyData();
  }
  
  return generateWorkerSafetyData(workerId);
}

function generateWorkerSafetyData(workerId) {
  const now = new Date();
  const workerIdNum = workerId ? parseInt(workerId) : 1;
  
  // Generate check-in history (last 30 days)
  const checkInHistory = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random check-ins throughout the day
    const checkInCount = Math.floor(Math.random() * 3) + 1; // 1-3 check-ins per day
    
    for (let j = 0; j < checkInCount; j++) {
      const checkInTime = new Date(date);
      checkInTime.setHours(Math.floor(Math.random() * 12) + 8); // 8 AM - 8 PM
      checkInTime.setMinutes(Math.floor(Math.random() * 60));
      
      // 5% chance of emergency, 10% chance of warning, 85% safe
      const rand = Math.random();
      let status = 'safe';
      let type = 'checkin';
      let notes = '';
      
      if (rand < 0.05) {
        status = 'emergency';
        type = 'emergency';
        notes = 'Emergency assistance needed - Immediate help required';
      } else if (rand < 0.15) {
        status = 'warning';
        type = 'checkin';
        notes = Math.random() > 0.5 ? 'Delayed check-in' : '';
      } else {
        status = 'safe';
        type = 'checkin';
        notes = Math.random() > 0.7 ? 'All good, working as usual' : '';
      }
      
      checkInHistory.push({
        id: Date.now() - (i * 86400000) - (j * 3600000),
        timestamp: checkInTime.toISOString(),
        status: status,
        type: type,
        latitude: 32.0853 + (Math.random() - 0.5) * 0.1,
        longitude: 34.7818 + (Math.random() - 0.5) * 0.1,
        location: {
          address: getRandomLocation(),
          city: 'Tel Aviv',
          country: 'Israel'
        },
        notes: notes,
        message: type === 'emergency' ? 'Emergency alert sent to authorities' : ''
      });
    }
  }
  
  checkInHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Current status
  const lastCheckIn = checkInHistory[0];
  const hoursSinceCheckIn = (now - new Date(lastCheckIn.timestamp)) / (1000 * 60 * 60);
  
  let status = 'safe';
  let statusMessage = 'All systems normal';
  
  if (hoursSinceCheckIn > 4) {
    status = 'warning';
    statusMessage = `No check-in for ${Math.floor(hoursSinceCheckIn)} hours`;
  }
  
  if (hoursSinceCheckIn > 8) {
    status = 'critical';
    statusMessage = 'Emergency check-in required';
  }
  
  // Location tracking
  const currentLocation = {
    latitude: lastCheckIn.latitude,
    longitude: lastCheckIn.longitude,
    accuracy: Math.floor(Math.random() * 20) + 5, // 5-25 meters
    timestamp: lastCheckIn.timestamp,
    address: lastCheckIn.location.address,
    city: lastCheckIn.location.city,
    country: lastCheckIn.location.country
  };
  
  // Recent location history (last 24 hours)
  const locationHistory = checkInHistory
    .filter(ci => {
      const ciTime = new Date(ci.timestamp);
      return (now - ciTime) <= 24 * 60 * 60 * 1000;
    })
    .map(ci => ({
      latitude: ci.latitude,
      longitude: ci.longitude,
      timestamp: ci.timestamp
    }));
  
  // Geo-fence status
  const geoFenceStatus = {
    isInside: true,
    fenceName: 'Work Site - Tel Aviv',
    lastCheck: lastCheckIn.timestamp,
    violations: []
  };
  
  // Emergency contacts
  const emergencyContacts = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      relationship: 'Brother',
      phone: '+91-9876543210',
      whatsapp: '+91-9876543210',
      email: 'rajesh@example.com'
    },
    {
      id: 2,
      name: 'NSDC Emergency',
      relationship: 'Organization',
      phone: '+91-11-4747-4700',
      whatsapp: '+91-11-4747-4700',
      email: 'emergency@nsdcindia.org'
    },
    {
      id: 3,
      name: 'PIBA Israel',
      relationship: 'Government',
      phone: '+972-2-629-4666',
      whatsapp: null,
      email: 'piba@piba.gov.il'
    }
  ];
  
  // Statistics
  const stats = {
    totalCheckIns: checkInHistory.length,
    onTimeCheckIns: checkInHistory.filter(ci => ci.status === 'safe').length,
    missedCheckIns: Math.floor(checkInHistory.length * 0.1),
    averageResponseTime: '2.5 minutes',
    daysActive: 30
  };
  
  return {
    status: {
      current: status,
      message: statusMessage,
      lastCheckIn: lastCheckIn.timestamp,
      hoursSinceCheckIn: Math.floor(hoursSinceCheckIn * 10) / 10,
      israelDetected: true,
      serviceActive: true
    },
    checkInHistory,
    locationTracking: {
      currentLocation,
      locationHistory,
      isTracking: true
    },
    geoFenceStatus,
    emergencyContacts,
    stats
  };
}

function generateAdminSafetyData() {
  const workers = [];
  const workerNames = [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Devi',
    'Vikram Singh', 'Anjali Gupta', 'Rahul Mehta', 'Kavita Reddy',
    'Suresh Nair', 'Meera Iyer', 'Deepak Joshi', 'Lakshmi Menon'
  ];
  
  for (let i = 0; i < 12; i++) {
    const workerData = generateWorkerSafetyData(i + 1);
    workers.push({
      id: i + 1,
      name: workerNames[i],
      email: `${workerNames[i].toLowerCase().replace(' ', '.')}@example.com`,
      phone: `+91-9${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      status: workerData.status,
      lastCheckIn: workerData.checkInHistory[0]?.timestamp,
      location: workerData.locationTracking.currentLocation,
      employer: `Employer ${Math.floor(i / 3) + 1}`,
      jobTitle: ['Construction Worker', 'Healthcare Assistant', 'Agricultural Worker'][i % 3]
    });
  }
  
  // Emergency alerts
  const emergencyAlerts = workers
    .filter(w => w.status.current === 'critical' || w.status.current === 'warning')
    .map(w => ({
      id: Date.now() - Math.random() * 1000000,
      workerId: w.id,
      workerName: w.name,
      type: w.status.current === 'critical' ? 'emergency' : 'warning',
      message: w.status.message,
      timestamp: w.lastCheckIn,
      location: w.location,
      status: 'active'
    }));
  
  // Overall statistics
  const overallStats = {
    totalWorkers: workers.length,
    safeWorkers: workers.filter(w => w.status.current === 'safe').length,
    warningWorkers: workers.filter(w => w.status.current === 'warning').length,
    criticalWorkers: workers.filter(w => w.status.current === 'critical').length,
    activeCheckIns: workers.filter(w => {
      const hoursSince = (new Date() - new Date(w.lastCheckIn)) / (1000 * 60 * 60);
      return hoursSince <= 4;
    }).length,
    averageResponseTime: '2.3 minutes',
    systemUptime: '99.8%'
  };
  
  return {
    allWorkersStatus: workers,
    emergencyAlerts,
    overallStats
  };
}

function getRandomLocation() {
  const locations = [
    'Construction Site - Dizengoff Street',
    'Work Site - Rothschild Boulevard',
    'Accommodation - Ben Yehuda Street',
    'Work Site - Jaffa Road',
    'Construction Site - Allenby Street',
    'Work Site - King George Street',
    'Accommodation - HaYarkon Street',
    'Work Site - Ibn Gabirol Street'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

module.exports = {
  generateSafetyData
};
