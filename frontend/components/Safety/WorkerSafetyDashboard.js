import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import Error from '@mui/icons-material/Error';
import ReportProblem from '@mui/icons-material/ReportProblem';
import Refresh from '@mui/icons-material/Refresh';
import History from '@mui/icons-material/History';
import LocationOn from '@mui/icons-material/LocationOn';
import api from '../../utils/api';

const WorkerSafetyDashboard = ({ workerId = '1' }) => {
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [emergencyDialog, setEmergencyDialog] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('');

  const loadSafetyData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/safety/worker/${workerId}/status`);
      const checkInsResponse = await api.get(`/safety/worker/${workerId}/checkins`);
      const locationResponse = await api.get(`/safety/worker/${workerId}/location`);
      
      setSafetyData({
        status: response.data?.data || response.data || {},
        checkIns: checkInsResponse.data?.data || checkInsResponse.data || [],
        location: locationResponse.data?.data || locationResponse.data || {}
      });
    } catch (error) {
      console.error('Error loading safety data:', error);
      setSafetyData({
        status: { current: 'safe', message: 'Unable to load status' },
        checkIns: [],
        location: {}
      });
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    loadSafetyData();
    const interval = setInterval(loadSafetyData, 30000);
    return () => clearInterval(interval);
  }, [loadSafetyData]);

  const handleCheckIn = async () => {
    try {
      const location = safetyData?.location?.currentLocation || {
        latitude: 32.0853,
        longitude: 34.7818
      };

      await api.post(`/safety/worker/${workerId}/checkin`, {
        latitude: location.latitude,
        longitude: location.longitude,
        status: 'safe',
        notes: checkInNotes
      });

      setCheckInDialog(false);
      setCheckInNotes('');
      loadSafetyData();
    } catch (error) {
      console.error('Error submitting check-in:', error);
    }
  };

  const handleEmergency = async () => {
    try {
      const location = safetyData?.location?.currentLocation || {
        latitude: 32.0853,
        longitude: 34.7818
      };

      await api.post(`/safety/worker/${workerId}/emergency`, {
        latitude: location.latitude,
        longitude: location.longitude,
        type: 'emergency',
        message: emergencyMessage || 'Emergency assistance needed'
      });

      setEmergencyDialog(false);
      setEmergencyMessage('');
      loadSafetyData();
      alert('Emergency alert sent! Help is on the way.');
    } catch (error) {
      console.error('Error sending emergency alert:', error);
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
      case 'safe': return React.createElement(CheckCircle);
      case 'warning': return React.createElement(Warning);
      case 'critical': return React.createElement(Error);
      default: return React.createElement(CheckCircle);
    }
  };

  if (loading && !safetyData) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading safety data...</Typography>
      </Box>
    );
  }

  if (!safetyData || !safetyData.status) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No safety data available</Alert>
      </Box>
    );
  }

  const { status, checkIns, location } = safetyData;
  const currentStatus = status?.current || 'safe';
  const statusMessage = status?.message || 'Status unknown';

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Safety Status
              </Typography>
              <Chip
                icon={getStatusIcon(currentStatus)}
                label={currentStatus.toUpperCase()}
                color={getStatusColor(currentStatus)}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
              />
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                {statusMessage}
              </Typography>
              {status?.hoursSinceCheckIn !== undefined && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                  Last check-in: {status.hoursSinceCheckIn.toFixed(1)} hours ago
                </Typography>
              )}
            </Box>
            <IconButton onClick={loadSafetyData} sx={{ color: 'white' }}>
              <Refresh />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            startIcon={<CheckCircle />}
            onClick={() => setCheckInDialog(true)}
            sx={{ py: 2 }}
          >
            Check In Now
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            size="large"
            startIcon={<ReportProblem />}
            onClick={() => setEmergencyDialog(true)}
            sx={{ py: 2 }}
          >
            Emergency Alert
          </Button>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOn color="primary" />
            <Typography variant="h6">
              Current Location
            </Typography>
          </Box>
          {location?.currentLocation && (
            <Box>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
                {location.currentLocation.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {location.currentLocation.city}, {location.currentLocation.country}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Accuracy: {location.currentLocation.accuracy}m
              </Typography>
              <Chip
                icon={<CheckCircle />}
                label="Tracking Active"
                color="success"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <History />
            <Typography variant="h6">
              Recent Check-ins & Alerts
            </Typography>
          </Box>
          <List>
            {checkIns && Array.isArray(checkIns) && checkIns.length > 0 ? (
              checkIns.slice(0, 10).map((checkIn, index) => {
                const isEmergency = checkIn.type === 'emergency' || checkIn.status === 'emergency';
                const isWarning = checkIn.status === 'warning' && !isEmergency;
                const isSafe = checkIn.status === 'safe';
                
                return (
                  <Box key={checkIn.id || index}>
                    <ListItem
                      sx={{
                        bgcolor: isEmergency ? 'rgba(211, 47, 47, 0.1)' : isWarning ? 'rgba(237, 108, 2, 0.1)' : 'transparent',
                        borderRadius: 1,
                        mb: 0.5,
                        border: isEmergency ? '2px solid' : isWarning ? '1px solid' : 'none',
                        borderColor: isEmergency ? 'error.main' : isWarning ? 'warning.main' : 'transparent',
                        '&:hover': {
                          bgcolor: isEmergency ? 'rgba(211, 47, 47, 0.2)' : isWarning ? 'rgba(237, 108, 2, 0.2)' : 'action.hover',
                        },
                        transition: 'all 0.2s',
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ 
                          bgcolor: isEmergency ? 'error.main' : isSafe ? 'success.main' : 'warning.main',
                          width: 40,
                          height: 40,
                        }}>
                          {isEmergency ? <ReportProblem /> : isSafe ? <CheckCircle /> : <Warning />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1" sx={{ fontWeight: isEmergency ? 700 : 500 }}>
                              {checkIn.timestamp ? new Date(checkIn.timestamp).toLocaleString() : 'Unknown time'}
                            </Typography>
                            {isEmergency && (
                              <Chip
                                icon={<ReportProblem />}
                                label="EMERGENCY"
                                size="small"
                                color="error"
                                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography component="span" variant="body2" color={isEmergency ? 'error.dark' : 'text.primary'} sx={{ fontWeight: isEmergency ? 600 : 400 }}>
                              {checkIn.location?.address || 'Location unknown'}
                            </Typography>
                            {(checkIn.notes || checkIn.message) && (
                              <Typography 
                                component="span" 
                                variant="body2" 
                                color={isEmergency ? 'error.dark' : 'text.secondary'} 
                                sx={{ 
                                  display: 'block', 
                                  mt: 0.5,
                                  fontWeight: isEmergency ? 600 : 400,
                                  fontStyle: isEmergency ? 'italic' : 'normal'
                                }}
                              >
                                {checkIn.message || checkIn.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={checkIn.status === 'emergency' ? 'EMERGENCY' : checkIn.status || 'unknown'}
                        color={isEmergency ? 'error' : isSafe ? 'success' : 'warning'}
                        size="small"
                        sx={{ 
                          fontWeight: isEmergency ? 700 : 500,
                          fontSize: isEmergency ? '0.75rem' : '0.875rem'
                        }}
                      />
                    </ListItem>
                    {index < checkIns.length - 1 && <Divider />}
                  </Box>
                );
              })
            ) : (
              <ListItem>
                <ListItemText primary="No check-ins available" />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      <Dialog open={checkInDialog} onClose={() => setCheckInDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Safety Check-in</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (Optional)"
            value={checkInNotes}
            onChange={(e) => setCheckInNotes(e.target.value)}
            placeholder="Add any notes about your current status..."
            sx={{ mt: 2 }}
          />
          {location?.currentLocation && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Location: {location.currentLocation.address}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialog(false)}>Cancel</Button>
          <Button onClick={handleCheckIn} variant="contained" color="primary">
            Check In
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={emergencyDialog} onClose={() => setEmergencyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
            <ReportProblem />
            Emergency Alert
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This will send an emergency alert to your contacts and authorities.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Emergency Details"
            value={emergencyMessage}
            onChange={(e) => setEmergencyMessage(e.target.value)}
            placeholder="Describe your emergency situation..."
            required
          />
          {location?.currentLocation && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Your location will be shared: {location.currentLocation.address}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialog(false)}>Cancel</Button>
          <Button onClick={handleEmergency} variant="contained" color="error">
            Send Emergency Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerSafetyDashboard;
