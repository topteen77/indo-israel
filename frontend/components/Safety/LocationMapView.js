import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import {
  LocationOn,
  Map,
  Refresh,
  Timeline,
} from '@mui/icons-material';
import api from '../../utils/api';

const LocationMapView = ({ workerId }) => {
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadLocationData();
    const interval = setInterval(loadLocationData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [workerId]);

  const loadLocationData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/safety/worker/${workerId}/location?includeHistory=true&days=1`
      );
      setLocationData(response.data.data);
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGoogleMapsUrl = (latitude, longitude) => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  const getGoogleMapsEmbedUrl = (latitude, longitude) => {
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${latitude},${longitude}&zoom=15`;
  };

  if (loading && !locationData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!locationData || !locationData.currentLocation) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">No location data available</Alert>
        </CardContent>
      </Card>
    );
  }

  const { currentLocation, locationHistory, geoFenceStatus, stats } = locationData;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Map color="primary" />
          Location Map View
        </Typography>
        <Box>
          <Button
            size="small"
            startIcon={<Timeline />}
            onClick={() => setShowHistory(!showHistory)}
            sx={{ mr: 1 }}
          >
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={loadLocationData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Map View */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ position: 'relative', width: '100%', height: '400px', mb: 2 }}>
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: 8 }}
                src={getGoogleMapsEmbedUrl(currentLocation.latitude, currentLocation.longitude)}
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <Paper
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'grey.100',
                }}
              >
                <LocationOn sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Map View
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure Google Maps API key to enable map view
                </Typography>
                <Button
                  variant="outlined"
                  href={getGoogleMapsUrl(currentLocation.latitude, currentLocation.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </Button>
              </Paper>
            )}
          </Box>

          {/* Location Details */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {currentLocation.address || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentLocation.city}, {currentLocation.country}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Coordinates
              </Typography>
              <Typography variant="body1">
                {currentLocation.latitude?.toFixed(6)}, {currentLocation.longitude?.toFixed(6)}
              </Typography>
              {currentLocation.accuracy && (
                <Typography variant="caption" color="text.secondary">
                  Accuracy: ±{Math.round(currentLocation.accuracy)}m
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                size="small"
                href={getGoogleMapsUrl(currentLocation.latitude, currentLocation.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<LocationOn />}
              >
                View in Google Maps
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Geo-fence Status */}
      {geoFenceStatus && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Geo-fence Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={geoFenceStatus.isInside ? 'Inside Fence' : 'Outside Fence'}
                color={geoFenceStatus.isInside ? 'success' : 'warning'}
              />
              <Chip
                label={`${geoFenceStatus.activeFences} Active Fences`}
                variant="outlined"
              />
            </Box>
            {geoFenceStatus.nearestFence && (
              <Typography variant="body2" color="text.secondary">
                Nearest: {geoFenceStatus.nearestFence.name} ({Math.round(geoFenceStatus.nearestFence.distance)}m away)
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location History */}
      {showHistory && locationHistory && locationHistory.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Location History (Last 24 Hours)
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {locationHistory.map((loc, index) => (
                <Paper
                  key={loc.id || index}
                  sx={{
                    p: 2,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(loc.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                    </Typography>
                    {loc.eventType && (
                      <Chip
                        label={loc.eventType}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                  <Button
                    size="small"
                    href={getGoogleMapsUrl(loc.latitude, loc.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </Button>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Location Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Total Updates
                </Typography>
                <Typography variant="h6">
                  {stats.totalUpdates || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Avg Accuracy
                </Typography>
                <Typography variant="h6">
                  {stats.avgAccuracy ? `${Math.round(stats.avgAccuracy)}m` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Active Violations
                </Typography>
                <Typography variant="h6" color={stats.activeViolations > 0 ? 'error.main' : 'success.main'}>
                  {stats.activeViolations || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Period
                </Typography>
                <Typography variant="h6">
                  {stats.period || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default LocationMapView;
