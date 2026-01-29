import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip,
  Alert, LinearProgress, List, ListItem, ListItemText,
  ListItemIcon, Avatar, IconButton, Paper, Tabs, Tab
} from '@mui/material';
import {
  LocationOn, CheckCircle, Warning, Error, Refresh,
  Phone, WhatsApp, Email, AccessTime, Person, Map
} from '@mui/icons-material';
import api from '../../utils/api';
import LocationMapView from './LocationMapView';

const FamilyPortal = ({ workerId = '1' }) => {
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadSafetyData();
    const interval = setInterval(loadSafetyData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [workerId]);

  const loadSafetyData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/safety/family/${workerId}/status?includeLocation=true&includeHistory=true`);
      setSafetyData(response.data.data);
    } catch (error) {
      console.error('Error loading safety data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'safe': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Error />;
      default: return <LocationOn />;
    }
  };

  if (loading && !safetyData) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading worker safety status...</Typography>
      </Box>
    );
  }

  if (!safetyData) return null;

  const { status, lastCheckIn, location, locationHistory } = safetyData;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Worker Safety Status</Typography>
        <IconButton onClick={loadSafetyData}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<Person />} label="Status" />
        <Tab icon={<Map />} label="Location Map" />
      </Tabs>

      {/* Status Tab */}
      {activeTab === 0 && (
        <>

      {/* Status Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Current Status
          </Typography>
          <Chip
            icon={getStatusIcon(status.current)}
            label={status.current.toUpperCase()}
            color={getStatusColor(status.current)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', mb: 2 }}
          />
          <Typography variant="body1" sx={{ mb: 1 }}>
            {status.message}
          </Typography>
          {status.hoursSinceCheckIn !== undefined && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Last check-in: {status.hoursSinceCheckIn.toFixed(1)} hours ago
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Location Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn color="primary" />
            Current Location
          </Typography>
          {location ? (
            <>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {location.address || 'Location not available'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {location.city}, {location.country}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Coordinates
                  </Typography>
                  <Typography variant="body2">
                    {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                  </Typography>
                </Grid>
                {location.accuracy && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Accuracy
                    </Typography>
                    <Typography variant="body2">
                      ±{Math.round(location.accuracy)}m
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Last updated: {new Date(location.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Location data not available
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Location History */}
      {locationHistory && locationHistory.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn color="primary" />
              Recent Location History
            </Typography>
            <List dense>
              {locationHistory.slice(0, 10).map((loc, index) => (
                <ListItem key={loc.id || index}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                      <LocationOn fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={new Date(loc.timestamp).toLocaleString()}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                        </Typography>
                        {loc.eventType && (
                          <Chip
                            label={loc.eventType}
                            size="small"
                            sx={{ ml: 1, height: 20 }}
                          />
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Last Check-in */}
      {lastCheckIn && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime />
              Last Check-in
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: lastCheckIn.status === 'safe' ? 'success.main' : 'warning.main' }}>
                    {lastCheckIn.status === 'safe' ? <CheckCircle /> : <Warning />}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={new Date(lastCheckIn.timestamp).toLocaleString()}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {lastCheckIn.location?.address}
                      </Typography>
                      {lastCheckIn.notes && (
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                          {lastCheckIn.notes}
                        </Typography>
                      )}
                    </>
                  }
                />
                <Chip
                  label={lastCheckIn.status}
                  color={lastCheckIn.status === 'safe' ? 'success' : 'warning'}
                  size="small"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Emergency Contacts
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            In case of emergency, contact these numbers immediately.
          </Alert>
          <List>
            <ListItem>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Phone />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary="NSDC Emergency"
                secondary="+91-11-4747-4700"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <WhatsApp />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary="WhatsApp Support"
                secondary="+91-11-4747-4700"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Email />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary="Email Support"
                secondary="emergency@nsdcindia.org"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
        </>
      )}

      {/* Location Map Tab */}
      {activeTab === 1 && (
        <LocationMapView workerId={workerId} />
      )}
    </Box>
  );
};

export default FamilyPortal;
