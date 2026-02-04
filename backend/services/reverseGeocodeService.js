/**
 * Reverse Geocoding Service (no API key)
 * Uses OpenStreetMap Nominatim to convert lat/lng to a human readable address.
 *
 * Notes:
 * - Best-effort only; always fall back to coordinates if this fails.
 * - Nominatim requires a descriptive User-Agent.
 */
const https = require('https');

// Small in-memory cache to reduce external calls and latency.
// Key: "lat,lng" rounded to 5 decimals (~1m-2m) to improve hit rate.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map(); // key -> { value: string|null, expiresAt: number }

function httpsGetJson(url, headers = {}, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode || 0, json });
        } catch (e) {
          reject(new Error(`Failed to parse JSON response: ${e.message}`));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Reverse geocode request timed out'));
    });

    req.on('error', reject);
  });
}

function formatFromAddressParts(addr = {}) {
  // Try to build a user-friendly, compact location string
  const parts = [
    addr.neighbourhood || addr.suburb || addr.quarter || addr.hamlet || addr.village,
    addr.city || addr.town || addr.county || addr.state_district,
    addr.state,
    addr.country,
  ].filter(Boolean);

  // Dedupe consecutive duplicates
  const compact = [];
  for (const p of parts) {
    if (compact[compact.length - 1] !== p) compact.push(p);
  }
  return compact.join(', ');
}

async function reverseGeocode(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Nominatim reverse endpoint
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

  const headers = {
    // Keep this descriptive to satisfy Nominatim policy
    'User-Agent': 'ApravasRecruitmentPlatform/1.0 (Emergency reverse geocoding)',
    'Accept': 'application/json',
  };

  const { statusCode, json } = await httpsGetJson(url, headers, 4000);
  if (statusCode < 200 || statusCode >= 300) {
    cache.set(key, { value: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }

  // Prefer a compact address, then display_name
  const formatted = formatFromAddressParts(json.address);
  const value = formatted || json.display_name || null;
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

module.exports = { reverseGeocode };

