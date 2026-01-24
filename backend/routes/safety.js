const express = require('express');
const router = express.Router();
const { generateSafetyData } = require('../services/safetyService');

// Get worker safety status
router.get('/worker/:workerId/status', (req, res) => {
  const { workerId } = req.params;
  const data = generateSafetyData(workerId);
  res.json({
    success: true,
    data: data.status
  });
});

// Submit check-in
router.post('/worker/:workerId/checkin', (req, res) => {
  const { workerId } = req.params;
  const { latitude, longitude, timestamp, status, notes } = req.body;
  
  const checkIn = {
    id: Date.now(),
    workerId,
    latitude,
    longitude,
    timestamp: timestamp || new Date().toISOString(),
    status: status || 'safe',
    notes: notes || '',
    location: {
      address: 'Tel Aviv, Israel',
      city: 'Tel Aviv',
      country: 'Israel'
    }
  };
  
  res.json({
    success: true,
    message: 'Check-in recorded successfully',
    data: checkIn
  });
});

// Get check-in history
router.get('/worker/:workerId/checkins', (req, res) => {
  const { workerId } = req.params;
  const { startDate, endDate, limit = 50 } = req.query;
  
  const data = generateSafetyData(workerId);
  
  // Get emergency alerts for this worker
  const emergencyAlerts = data.checkInHistory.filter(ci => ci.type === 'emergency' || ci.status === 'emergency');
  
  // Combine check-ins and emergency alerts, sorted by timestamp
  const allHistory = [...data.checkInHistory].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  res.json({
    success: true,
    data: allHistory,
    emergencyCount: emergencyAlerts.length
  });
});

// Emergency alert
router.post('/worker/:workerId/emergency', (req, res) => {
  const { workerId } = req.params;
  const { latitude, longitude, type, message } = req.body;
  
  const emergency = {
    id: Date.now(),
    workerId,
    latitude,
    longitude,
    type: type || 'general',
    message: message || 'Emergency assistance needed',
    timestamp: new Date().toISOString(),
    status: 'active',
    location: {
      address: 'Tel Aviv, Israel',
      city: 'Tel Aviv',
      country: 'Israel'
    }
  };
  
  // In production, this would trigger notifications to emergency contacts
  console.log('🚨 EMERGENCY ALERT:', emergency);
  
  res.json({
    success: true,
    message: 'Emergency alert sent successfully',
    data: emergency
  });
});

// Get location tracking data
router.get('/worker/:workerId/location', (req, res) => {
  const { workerId } = req.params;
  const data = generateSafetyData(workerId);
  res.json({
    success: true,
    data: data.locationTracking
  });
});

// Update location
router.post('/worker/:workerId/location', (req, res) => {
  const { workerId } = req.params;
  const { latitude, longitude, accuracy, timestamp } = req.body;
  
  const location = {
    workerId,
    latitude,
    longitude,
    accuracy: accuracy || 10,
    timestamp: timestamp || new Date().toISOString(),
    location: {
      address: 'Tel Aviv, Israel',
      city: 'Tel Aviv',
      country: 'Israel'
    }
  };
  
  res.json({
    success: true,
    message: 'Location updated successfully',
    data: location
  });
});

// Get geo-fence status
router.get('/worker/:workerId/geofence', (req, res) => {
  const { workerId } = req.params;
  const data = generateSafetyData(workerId);
  res.json({
    success: true,
    data: data.geoFenceStatus
  });
});

// Admin: Get all workers safety status
router.get('/admin/all-workers', (req, res) => {
  const data = generateSafetyData(null, true);
  res.json({
    success: true,
    data: data.allWorkersStatus
  });
});

// Admin: Get emergency alerts
router.get('/admin/emergencies', (req, res) => {
  const { status = 'all' } = req.query;
  const data = generateSafetyData(null, true);
  res.json({
    success: true,
    data: data.emergencyAlerts
  });
});

// Family: Get worker safety status (for family portal)
router.get('/family/:workerId/status', (req, res) => {
  const { workerId } = req.params;
  const data = generateSafetyData(workerId);
  res.json({
    success: true,
    data: {
      status: data.status,
      lastCheckIn: data.checkInHistory[0],
      location: data.locationTracking.currentLocation
    }
  });
});

module.exports = router;
