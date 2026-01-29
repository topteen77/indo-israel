const express = require('express');
const router = express.Router();
const { generateSafetyData } = require('../services/safetyService');
const { sendEmergencySMS } = require('../services/smsService');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const enhancedLocationService = require('../services/enhancedLocationService');
const locationService = require('../services/locationService');

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
router.post('/worker/:workerId/checkin', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { latitude, longitude, timestamp, status, notes } = req.body;
    
    // Store location if provided
    if (latitude && longitude) {
      await enhancedLocationService.storeLocation(workerId, {
        latitude,
        longitude,
        timestamp: timestamp || new Date().toISOString(),
        source: 'checkin',
      });

      // Add to history as check-in event
      await enhancedLocationService.addToHistory(workerId, {
        latitude,
        longitude,
        timestamp: timestamp || new Date().toISOString(),
        source: 'checkin',
        eventType: 'checkin',
        metadata: { status, notes },
      });
    }
    
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
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record check-in',
      error: error.message,
    });
  }
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
router.post('/worker/:workerId/emergency', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { latitude, longitude, type, message, workerName } = req.body;
    
    // Store emergency location
    if (latitude && longitude) {
      await enhancedLocationService.storeLocation(workerId, {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        source: 'emergency',
      });

      // Add to history as emergency event
      await enhancedLocationService.addToHistory(workerId, {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        source: 'emergency',
        eventType: 'emergency',
        metadata: { type, message },
      });
    }
    
    const emergency = {
      id: Date.now(),
      workerId,
      latitude,
      longitude,
      type: type || 'general',
      message: message || 'Emergency assistance needed',
      timestamp: new Date().toISOString(),
      status: 'active',
      workerName: workerName || `Worker ${workerId}`,
      location: {
        latitude,
        longitude,
        address: 'Tel Aviv, Israel',
        city: 'Tel Aviv',
        country: 'Israel'
      }
    };
    
    // Trigger emergency notifications (will log to console until services are configured)
    sendEmergencySMS(emergency, []).catch(err => console.error('Emergency SMS error:', err));
    
    // Send WhatsApp emergency notification
    const emergencyMessage = `🚨 EMERGENCY! Worker ${emergency.workerName} requires immediate assistance.
Location: ${latitude}, ${longitude}
Time: ${emergency.timestamp}
Contact emergency: ${process.env.ISRAEL_EMERGENCY_NUMBER || '100'}
ID: ${workerId}`;
    
    sendWhatsAppMessage(
      process.env.RECRUITMENT_WHATSAPP || '+91 11 4747 4700',
      emergencyMessage,
      { priority: 'critical', type: 'emergency' }
    ).catch(err => console.error('Emergency WhatsApp error:', err));
    
    res.json({
      success: true,
      message: 'Emergency alert sent successfully',
      data: emergency
    });
  } catch (error) {
    console.error('Error handling emergency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process emergency alert',
      error: error.message,
    });
  }
});

// Get location tracking data (Enhanced with database)
router.get('/worker/:workerId/location', (req, res) => {
  try {
    const { workerId } = req.params;
    const { includeHistory = false, days = 1 } = req.query;

    const currentLocation = enhancedLocationService.getCurrentLocation(workerId);
    const stats = enhancedLocationService.getLocationStats(workerId, parseInt(days));

    let locationHistory = null;
    if (includeHistory === 'true') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      locationHistory = enhancedLocationService.getLocationHistory(workerId, {
        startDate: startDate.toISOString(),
        limit: 100,
      });
    }

    // Get active geo-fences
    const geoFences = enhancedLocationService.getActiveGeoFences();

    // Check current location against geo-fences
    let geoFenceStatus = null;
    if (currentLocation) {
      const nearestFence = locationService.findNearestWorkSite(
        currentLocation.latitude,
        currentLocation.longitude
      );
      const isInside = nearestFence
        ? locationService.isWithinGeoFence(
            currentLocation.latitude,
            currentLocation.longitude,
            { lat: nearestFence.lat, lng: nearestFence.lng },
            nearestFence.radius
          )
        : false;

      geoFenceStatus = {
        isInside,
        nearestFence: nearestFence ? { ...nearestFence, isInside } : null,
        activeFences: geoFences.length,
      };
    }

    res.json({
      success: true,
      data: {
        currentLocation,
        locationHistory,
        geoFenceStatus,
        stats,
      },
    });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location data',
      error: error.message,
    });
  }
});

// Update location (Enhanced with database storage)
router.post('/worker/:workerId/location', async (req, res) => {
  try {
    const { workerId } = req.params;
    const locationData = req.body;

    if (!locationData.latitude || !locationData.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const result = await enhancedLocationService.storeLocation(workerId, {
      ...locationData,
      timestamp: locationData.timestamp || new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        locationId: result.locationId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        isInIsrael: result.isInIsrael,
        address: result.address,
        violations: result.violations,
      },
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message,
    });
  }
});

// Get location history
router.get('/worker/:workerId/location/history', (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate, limit = 100, source, eventType } = req.query;

    const history = enhancedLocationService.getLocationHistory(workerId, {
      startDate,
      endDate,
      limit: parseInt(limit),
      source,
      eventType,
    });

    res.json({
      success: true,
      data: {
        history,
        count: history.length,
      },
    });
  } catch (error) {
    console.error('Error getting location history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location history',
      error: error.message,
    });
  }
});

// Get geo-fence status
router.get('/worker/:workerId/geofence', (req, res) => {
  try {
    const { workerId } = req.params;
    const { includeViolations = false } = req.query;

    const currentLocation = enhancedLocationService.getCurrentLocation(workerId);
    const geoFences = enhancedLocationService.getActiveGeoFences();

    let geoFenceStatus = {
      isInside: false,
      activeFences: geoFences.length,
      fences: [],
    };

    if (currentLocation) {
      const fenceStatuses = geoFences.map((fence) => {
        const isInside = locationService.isWithinGeoFence(
          currentLocation.latitude,
          currentLocation.longitude,
          fence.center,
          fence.radius
        );
        return {
          ...fence,
          isInside,
          distance: locationService.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            fence.center.lat,
            fence.center.lng
          ),
        };
      });

      geoFenceStatus.fences = fenceStatuses;
      geoFenceStatus.isInside = fenceStatuses.some((f) => f.isInside);
    }

    let violations = null;
    if (includeViolations === 'true') {
      violations = enhancedLocationService.getGeoFenceViolations(workerId, {
        resolved: false,
        limit: 20,
      });
    }

    res.json({
      success: true,
      data: {
        ...geoFenceStatus,
        violations,
        currentLocation,
      },
    });
  } catch (error) {
    console.error('Error getting geo-fence status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get geo-fence status',
      error: error.message,
    });
  }
});

// Get geo-fence violations
router.get('/worker/:workerId/geofence/violations', (req, res) => {
  try {
    const { workerId } = req.params;
    const { resolved, limit = 50 } = req.query;

    const violations = enhancedLocationService.getGeoFenceViolations(workerId, {
      resolved: resolved === 'true',
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        violations,
        count: violations.length,
      },
    });
  } catch (error) {
    console.error('Error getting violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get violations',
      error: error.message,
    });
  }
});

// Resolve geo-fence violation
router.post('/worker/:workerId/geofence/violations/:violationId/resolve', (req, res) => {
  try {
    const { violationId } = req.params;
    const { notes } = req.body;
    const resolvedBy = req.user?.id || null; // Get from auth middleware

    enhancedLocationService.resolveViolation(violationId, resolvedBy, notes);

    res.json({
      success: true,
      message: 'Violation resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve violation',
      error: error.message,
    });
  }
});

// Admin: Create geo-fence
router.post('/admin/geofence', (req, res) => {
  try {
    const fenceData = req.body;
    const createdBy = req.user?.id || null;

    const fence = enhancedLocationService.createGeoFence({
      ...fenceData,
      createdBy,
    });

    res.status(201).json({
      success: true,
      message: 'Geo-fence created successfully',
      data: fence,
    });
  } catch (error) {
    console.error('Error creating geo-fence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create geo-fence',
      error: error.message,
    });
  }
});

// Admin: Get all geo-fences
router.get('/admin/geofences', (req, res) => {
  try {
    const fences = enhancedLocationService.getActiveGeoFences();

    res.json({
      success: true,
      data: {
        fences,
        count: fences.length,
      },
    });
  } catch (error) {
    console.error('Error getting geo-fences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get geo-fences',
      error: error.message,
    });
  }
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

// Family: Get worker safety status (Enhanced with location sharing)
router.get('/family/:workerId/status', (req, res) => {
  try {
    const { workerId } = req.params;
    const { includeLocation = true, includeHistory = false } = req.query;

    const data = generateSafetyData(workerId);
    const responseData = {
      status: data.status,
      lastCheckIn: data.checkInHistory[0],
    };

    if (includeLocation === 'true') {
      const currentLocation = enhancedLocationService.getCurrentLocation(workerId);
      responseData.location = currentLocation;

      if (includeHistory === 'true') {
        const history = enhancedLocationService.getLocationHistory(workerId, {
          limit: 50,
        });
        responseData.locationHistory = history;
      }
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error getting family status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get worker status',
      error: error.message,
    });
  }
});

module.exports = router;
