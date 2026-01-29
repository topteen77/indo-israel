const db = require('../database/db');
const locationService = require('./locationService');

/**
 * Enhanced Location Service with database persistence
 */
class EnhancedLocationService {
  /**
   * Store location update
   */
  async storeLocation(workerId, locationData) {
    try {
      const {
        latitude,
        longitude,
        accuracy,
        altitude,
        heading,
        speed,
        address,
        city,
        country,
        timestamp,
        source = 'gps',
        batteryLevel,
        isCharging = false,
      } = locationData;

      // Validate coordinates
      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
      }

      // Check if location is in Israel
      const isInIsrael = locationService.isLocationInIsrael(latitude, longitude);

      // Get address if not provided
      let finalAddress = address;
      let finalCity = city;
      let finalCountry = country || 'Israel';

      if (!finalAddress) {
        const addressData = locationService.getAddressFromCoordinates(latitude, longitude);
        finalAddress = addressData.address;
        finalCity = addressData.city;
        finalCountry = addressData.country;
      }

      // Store current location
      const insertLocation = db.prepare(`
        INSERT INTO worker_locations (
          workerId, latitude, longitude, accuracy, altitude, heading, speed,
          address, city, country, timestamp, source, batteryLevel, isCharging
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertLocation.run(
        workerId,
        latitude,
        longitude,
        accuracy || null,
        altitude || null,
        heading || null,
        speed || null,
        finalAddress,
        finalCity,
        finalCountry,
        timestamp || new Date().toISOString(),
        source,
        batteryLevel || null,
        isCharging ? 1 : 0
      );

      // Store in location history
      await this.addToHistory(workerId, {
        latitude,
        longitude,
        accuracy,
        timestamp: timestamp || new Date().toISOString(),
        source,
        eventType: 'update',
      });

      // Check geo-fence violations
      const violations = await this.checkGeoFences(workerId, latitude, longitude);

      return {
        success: true,
        locationId: result.lastInsertRowid,
        isInIsrael,
        address: {
          address: finalAddress,
          city: finalCity,
          country: finalCountry,
        },
        violations,
      };
    } catch (error) {
      console.error('Error storing location:', error);
      throw error;
    }
  }

  /**
   * Get current location for a worker
   */
  getCurrentLocation(workerId) {
    try {
      const location = db
        .prepare('SELECT * FROM worker_locations WHERE workerId = ? ORDER BY timestamp DESC LIMIT 1')
        .get(workerId);

      if (!location) {
        return null;
      }

      return {
        id: location.id,
        workerId: location.workerId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        heading: location.heading,
        speed: location.speed,
        address: location.address,
        city: location.city,
        country: location.country,
        timestamp: location.timestamp,
        source: location.source,
        batteryLevel: location.batteryLevel,
        isCharging: location.isCharging === 1,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get location history for a worker
   */
  getLocationHistory(workerId, options = {}) {
    try {
      const {
        startDate,
        endDate,
        limit = 100,
        source,
        eventType,
      } = options;

      let query = 'SELECT * FROM location_history WHERE workerId = ?';
      const params = [workerId];

      if (startDate) {
        query += ' AND timestamp >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND timestamp <= ?';
        params.push(endDate);
      }

      if (source) {
        query += ' AND source = ?';
        params.push(source);
      }

      if (eventType) {
        query += ' AND eventType = ?';
        params.push(eventType);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(parseInt(limit));

      const history = db.prepare(query).all(...params);

      return history.map((item) => ({
        id: item.id,
        workerId: item.workerId,
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy,
        timestamp: item.timestamp,
        source: item.source,
        eventType: item.eventType,
        metadata: item.metadata ? JSON.parse(item.metadata) : {},
      }));
    } catch (error) {
      console.error('Error getting location history:', error);
      return [];
    }
  }

  /**
   * Add entry to location history
   */
  async addToHistory(workerId, historyData) {
    try {
      const {
        latitude,
        longitude,
        accuracy,
        timestamp,
        source = 'gps',
        eventType = 'update',
        metadata = {},
      } = historyData;

      const insertHistory = db.prepare(`
        INSERT INTO location_history (
          workerId, latitude, longitude, accuracy, timestamp, source, eventType, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertHistory.run(
        workerId,
        latitude,
        longitude,
        accuracy || null,
        timestamp || new Date().toISOString(),
        source,
        eventType,
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.error('Error adding to location history:', error);
    }
  }

  /**
   * Create a geo-fence
   */
  createGeoFence(fenceData) {
    try {
      const {
        name,
        description,
        centerLatitude,
        centerLongitude,
        radius,
        type = 'work_site',
        active = true,
        createdBy,
      } = fenceData;

      const insertFence = db.prepare(`
        INSERT INTO geo_fences (
          name, description, centerLatitude, centerLongitude, radius, type, active, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertFence.run(
        name,
        description || null,
        centerLatitude,
        centerLongitude,
        radius,
        type,
        active ? 1 : 0,
        createdBy || null
      );

      return {
        id: result.lastInsertRowid,
        name,
        center: { lat: centerLatitude, lng: centerLongitude },
        radius,
        type,
        active,
      };
    } catch (error) {
      console.error('Error creating geo-fence:', error);
      throw error;
    }
  }

  /**
   * Get all active geo-fences
   */
  getActiveGeoFences() {
    try {
      const fences = db
        .prepare('SELECT * FROM geo_fences WHERE active = 1 ORDER BY name')
        .all();

      return fences.map((fence) => ({
        id: fence.id,
        name: fence.name,
        description: fence.description,
        center: {
          lat: fence.centerLatitude,
          lng: fence.centerLongitude,
        },
        radius: fence.radius,
        type: fence.type,
        active: fence.active === 1,
        createdAt: fence.createdAt,
      }));
    } catch (error) {
      console.error('Error getting geo-fences:', error);
      return [];
    }
  }

  /**
   * Check geo-fence violations for a location
   */
  async checkGeoFences(workerId, latitude, longitude) {
    try {
      const fences = this.getActiveGeoFences();
      const violations = [];

      for (const fence of fences) {
        const isInside = locationService.isWithinGeoFence(
          latitude,
          longitude,
          fence.center,
          fence.radius
        );

        // Check if worker was previously inside this fence
        const lastLocation = this.getCurrentLocation(workerId);
        let wasInside = false;

        if (lastLocation) {
          wasInside = locationService.isWithinGeoFence(
            lastLocation.latitude,
            lastLocation.longitude,
            fence.center,
            fence.radius
          );
        }

        // Detect violation type
        let violationType = null;
        if (!isInside && wasInside) {
          violationType = 'exit'; // Worker left the fence
        } else if (isInside && !wasInside) {
          violationType = 'entry'; // Worker entered the fence
        }

        if (violationType) {
          const distance = locationService.calculateDistance(
            latitude,
            longitude,
            fence.center.lat,
            fence.center.lng
          );

          // Determine severity based on fence type and distance
          let severity = 'warning';
          if (fence.type === 'restricted' || distance > fence.radius * 2) {
            severity = 'critical';
          }

          // Store violation
          const insertViolation = db.prepare(`
            INSERT INTO geo_fence_violations (
              workerId, geoFenceId, latitude, longitude, distance,
              violationType, severity, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const violationId = insertViolation.run(
            workerId,
            fence.id,
            latitude,
            longitude,
            distance,
            violationType,
            severity,
            new Date().toISOString()
          ).lastInsertRowid;

          violations.push({
            id: violationId,
            fenceId: fence.id,
            fenceName: fence.name,
            violationType,
            severity,
            distance,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return violations;
    } catch (error) {
      console.error('Error checking geo-fences:', error);
      return [];
    }
  }

  /**
   * Get geo-fence violations for a worker
   */
  getGeoFenceViolations(workerId, options = {}) {
    try {
      const { resolved, limit = 50 } = options;

      let query = `
        SELECT v.*, f.name as fenceName, f.type as fenceType
        FROM geo_fence_violations v
        JOIN geo_fences f ON v.geoFenceId = f.id
        WHERE v.workerId = ?
      `;
      const params = [workerId];

      if (resolved !== undefined) {
        query += ' AND v.resolved = ?';
        params.push(resolved ? 1 : 0);
      }

      query += ' ORDER BY v.timestamp DESC LIMIT ?';
      params.push(parseInt(limit));

      const violations = db.prepare(query).all(...params);

      return violations.map((v) => ({
        id: v.id,
        workerId: v.workerId,
        geoFenceId: v.geoFenceId,
        fenceName: v.fenceName,
        fenceType: v.fenceType,
        latitude: v.latitude,
        longitude: v.longitude,
        distance: v.distance,
        violationType: v.violationType,
        severity: v.severity,
        resolved: v.resolved === 1,
        resolvedAt: v.resolvedAt,
        notes: v.notes,
        timestamp: v.timestamp,
      }));
    } catch (error) {
      console.error('Error getting geo-fence violations:', error);
      return [];
    }
  }

  /**
   * Resolve a geo-fence violation
   */
  resolveViolation(violationId, resolvedBy, notes) {
    try {
      db.prepare(`
        UPDATE geo_fence_violations
        SET resolved = 1, resolvedAt = CURRENT_TIMESTAMP, resolvedBy = ?, notes = ?
        WHERE id = ?
      `).run(resolvedBy, notes || null, violationId);

      return { success: true };
    } catch (error) {
      console.error('Error resolving violation:', error);
      throw error;
    }
  }

  /**
   * Get location statistics for a worker
   */
  getLocationStats(workerId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = db
        .prepare(`
          SELECT
            COUNT(*) as totalUpdates,
            MIN(timestamp) as firstUpdate,
            MAX(timestamp) as lastUpdate,
            AVG(accuracy) as avgAccuracy
          FROM location_history
          WHERE workerId = ? AND timestamp >= ?
        `)
        .get(workerId, startDate.toISOString());

      const violations = db
        .prepare(`
          SELECT COUNT(*) as count
          FROM geo_fence_violations
          WHERE workerId = ? AND resolved = 0 AND timestamp >= ?
        `)
        .get(workerId, startDate.toISOString());

      return {
        totalUpdates: stats.totalUpdates || 0,
        firstUpdate: stats.firstUpdate,
        lastUpdate: stats.lastUpdate,
        avgAccuracy: stats.avgAccuracy || 0,
        activeViolations: violations.count || 0,
        period: `${days} days`,
      };
    } catch (error) {
      console.error('Error getting location stats:', error);
      return null;
    }
  }
}

module.exports = new EnhancedLocationService();
