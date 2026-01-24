import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Alert, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemText, ListItemIcon, Avatar
} from '@mui/material';
import {
  LocationOn, CheckCircle, Warning, Error, ReportProblem,
  Refresh, Phone, WhatsApp, Email, AccessTime, Person
} from '@mui/icons-material';
import api from '../../utils/api';

const AdminSafetyDashboard = () => {
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerDetailsDialog, setWorkerDetailsDialog] = useState(false);

  useEffect(() => {
    loadSafetyData();
    const interval = setInterval(loadSafetyData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSafetyData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/safety/admin/all-workers');
      const emergenciesResponse = await api.get('/safety/admin/emergencies');
      
      setSafetyData({
        workers: response.data.data,
        emergencies: emergenciesResponse.data.data,
        stats: response.data.data.reduce((acc, worker) => {
          acc.total++;
          if (worker.status.current === 'safe') acc.safe++;
          if (worker.status.current === 'warning') acc.warning++;
          if (worker.status.current === 'critical') acc.critical++;
          return acc;
        }, { total: 0, safe: 0, warning: 0, critical: 0 })
      });
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

  const handleViewWorker = (worker) => {
    setSelectedWorker(worker);
    setWorkerDetailsDialog(true);
  };

  if (loading && !safetyData) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading safety monitoring data...</Typography>
      </Box>
    );
  }

  if (!safetyData) return null;

  const { workers, emergencies, stats } = safetyData;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Safety & Welfare Monitoring</Typography>
        <IconButton onClick={loadSafetyData}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Workers
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Typography gutterBottom>Safe</Typography>
              <Typography variant="h4">{stats.safe}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Typography gutterBottom>Warning</Typography>
              <Typography variant="h4">{stats.warning}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
            <CardContent>
              <Typography gutterBottom>Critical</Typography>
              <Typography variant="h4">{stats.critical}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Emergency Alerts */}
      {emergencies && emergencies.length > 0 && (
        <Card sx={{ mb: 3, border: '2px solid', borderColor: 'error.main' }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              <ReportProblem sx={{ mr: 1, verticalAlign: 'middle' }} />
              Active Emergency Alerts
            </Typography>
            <List>
              {emergencies.map((alert) => (
                <ListItem key={alert.id}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <ReportProblem />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.workerName}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {alert.message}
                        </Typography>
                        <Typography component="span" variant="caption" sx={{ display: 'block' }}>
                          {new Date(alert.timestamp).toLocaleString()} - {alert.location?.address}
                        </Typography>
                      </>
                    }
                  />
                  <Chip label="Active" color="error" size="small" />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Workers Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Workers Status
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Worker</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Check-in</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Employer</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {worker.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {worker.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {worker.jobTitle}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(worker.status.current)}
                        label={worker.status.current}
                        color={getStatusColor(worker.status.current)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {worker.lastCheckIn
                          ? new Date(worker.lastCheckIn).toLocaleString()
                          : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {worker.location?.address || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>{worker.employer}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleViewWorker(worker)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Worker Details Dialog */}
      <Dialog
        open={workerDetailsDialog}
        onClose={() => setWorkerDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Worker Safety Details - {selectedWorker?.name}
        </DialogTitle>
        <DialogContent>
          {selectedWorker && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedWorker.status.current)}
                  label={selectedWorker.status.current}
                  color={getStatusColor(selectedWorker.status.current)}
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedWorker.status.message}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Contact
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedWorker.email}
                </Typography>
                <Typography variant="body2">
                  {selectedWorker.phone}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Location
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedWorker.location?.address}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedWorker.location?.city}, {selectedWorker.location?.country}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkerDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSafetyDashboard;
