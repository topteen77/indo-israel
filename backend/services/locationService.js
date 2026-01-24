// Location Service Utilities
// Geo-fencing and location detection for Israel

class LocationService {
  constructor() {
    // Israel approximate boundaries
    this.israelBounds = {
      north: 33.3406,  // Northernmost point
      south: 29.5013,  // Southernmost point
      east: 35.8363,   // Easternmost point
      west: 34.2675    // Westernmost point
    };
    
    // Major cities in Israel with coordinates
    this.majorCities = {
      'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
      'Jerusalem': { lat: 31.7683, lng: 35.2137 },
      'Haifa': { lat: 32.7940, lng: 34.9896 },
      'Beer Sheva': { lat: 31.2457, lng: 34.7925 },
      'Netanya': { lat: 32.3320, lng: 34.8554 },
      'Ashdod': { lat: 31.8044, lng: 34.6553 },
      'Rishon LeZion': { lat: 31.9730, lng: 34.7925 },
      'Petah Tikva': { lat: 32.0871, lng: 34.8878 }
    };
    
    // Common work site locations
    this.workSites = [
      { name: 'Construction Site - Tel Aviv', lat: 32.0853, lng: 34.7818, radius: 500 },
      { name: 'Construction Site - Jerusalem', lat: 31.7683, lng: 35.2137, radius: 500 },
      { name: 'Work Site - Haifa', lat: 32.7940, lng: 34.9896, radius: 500 },
      { name: 'Accommodation - Tel Aviv', lat: 32.0800, lng: 34.7800, radius: 200 }
    ];
  }
  
  /**
   * Check if a location is within Israel boundaries
   */
  isLocationInIsrael(latitude, longitude) {
    return (
      latitude >= this.israelBounds.south &&
      latitude <= this.israelBounds.north &&
      longitude >= this.israelBounds.west &&
      longitude <= this.israelBounds.east
    );
  }
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  }
  
  /**
   * Check if location is within a geo-fence
   */
  isWithinGeoFence(latitude, longitude, fenceCenter, radius) {
    const distance = this.calculateDistance(
      latitude,
      longitude,
      fenceCenter.lat,
      fenceCenter.lng
    );
    return distance <= radius;
  }
  
  /**
   * Find nearest work site
   */
  findNearestWorkSite(latitude, longitude) {
    let nearest = null;
    let minDistance = Infinity;
    
    for (const site of this.workSites) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        site.lat,
        site.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...site, distance };
      }
    }
    
    return nearest;
  }
  
  /**
   * Get address from coordinates (mock implementation)
   */
  getAddressFromCoordinates(latitude, longitude) {
    // In production, this would use a geocoding service like Google Maps API
    const nearestCity = this.findNearestCity(latitude, longitude);
    return {
      address: `${nearestCity.name}, Israel`,
      city: nearestCity.name,
      country: 'Israel',
      formatted: `${nearestCity.name}, Israel`
    };
  }
  
  /**
   * Find nearest city
   */
  findNearestCity(latitude, longitude) {
    let nearest = null;
    let minDistance = Infinity;
    
    for (const [name, coords] of Object.entries(this.majorCities)) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        coords.lat,
        coords.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { name, ...coords, distance };
      }
    }
    
    return nearest || { name: 'Unknown', lat: latitude, lng: longitude };
  }
  
  /**
   * Detect if device is in Israel based on SIM/Network
   * Mock implementation - in production would use device APIs
   */
  async detectIsraelLocation() {
    // Mock: Simulate detection
    // In production, this would check:
    // 1. SIM card country code (IL for Israel)
    // 2. Network country code
    // 3. GPS location
    
    return {
      detected: true,
      method: 'gps', // 'sim', 'network', or 'gps'
      confidence: 0.95,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Create geo-fence for a work site
   */
  createGeoFence(name, latitude, longitude, radius = 500) {
    return {
      id: Date.now(),
      name,
      center: { lat: latitude, lng: longitude },
      radius, // in meters
      active: true,
      createdAt: new Date().toISOString()
    };
  }
  
  /**
   * Check geo-fence violations
   */
  checkGeoFenceViolations(latitude, longitude, geoFences) {
    const violations = [];
    
    for (const fence of geoFences) {
      if (!fence.active) continue;
      
      const isInside = this.isWithinGeoFence(
        latitude,
        longitude,
        fence.center,
        fence.radius
      );
      
      if (!isInside) {
        violations.push({
          fenceId: fence.id,
          fenceName: fence.name,
          distance: this.calculateDistance(
            latitude,
            longitude,
            fence.center.lat,
            fence.center.lng
          ),
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return violations;
  }
}

module.exports = new LocationService();
