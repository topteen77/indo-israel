import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Avatar, LinearProgress, IconButton, Tab, Tabs,
  Badge, Tooltip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  FormHelperText, Snackbar,
} from '@mui/material';
import {
  Work, People, Assessment, Schedule, CheckCircle,
  Warning, Visibility, Message, Download, Edit,
  TrendingUp, Close, Add,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../utils/api';

const IsraeliEmployerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [postJobDialogOpen, setPostJobDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    experience: '',
    type: 'Full-time',
    description: '',
    requirements: '',
    category: '',
    openings: 1,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 120000); // 2 min refresh
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboards/employer');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch employer dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'success',
      'filled': 'info',
      'inactive': 'warning',
      'expired': 'error',
      'submitted': 'primary',
      'under_review': 'warning',
      'interviewed': 'info',
      'approved': 'success',
      'rejected': 'error'
    };
    return colors[status] || 'default';
  };

  const handleInputChange = (field, value) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!jobForm.title.trim()) errors.title = 'Job title is required';
    if (!jobForm.location.trim()) errors.location = 'Location is required';
    if (!jobForm.salary.trim()) errors.salary = 'Salary is required';
    if (!jobForm.description.trim()) errors.description = 'Description is required';
    if (!jobForm.category) errors.category = 'Category is required';
    if (!jobForm.company.trim()) errors.company = 'Company name is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePostJob = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      const requirementsArray = jobForm.requirements
        ? jobForm.requirements.split(',').map(r => r.trim()).filter(r => r)
        : [];

      const response = await api.post('/jobs/create', {
        title: jobForm.title,
        company: jobForm.company,
        location: jobForm.location,
        salary: jobForm.salary,
        experience: jobForm.experience,
        type: jobForm.type,
        description: jobForm.description,
        requirements: requirementsArray,
        category: jobForm.category,
        openings: parseInt(jobForm.openings) || 1,
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Job posted successfully!',
          severity: 'success'
        });
        // Reset form
        setJobForm({
          title: '',
          company: '',
          location: '',
          salary: '',
          experience: '',
          type: 'Full-time',
          description: '',
          requirements: '',
          category: '',
          openings: 1,
        });
        setPostJobDialogOpen(false);
        // Refresh dashboard data
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setSnackbar({
        open: true,
        message: 'Failed to post job. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setPostJobDialogOpen(false);
    setFormErrors({});
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!dashboardData) {
    return <Alert severity="error">Failed to load dashboard data.</Alert>;
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1">
            Israeli Employer Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {dashboardData.profile.companyName}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setPostJobDialogOpen(true)}
            sx={{
              bgcolor: '#7B0FF5',
              '&:hover': {
                bgcolor: '#9D4EDD',
              },
            }}
          >
            Post New Job
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Jobs
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.jobs.activeJobs}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{dashboardData.jobs.totalJobs - dashboardData.jobs.activeJobs} this month
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Work />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Applications
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.jobs.totalApplications}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg: {dashboardData.jobs.averageApplications} per job
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Approval Rate
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.performance.overall.approvalRate}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Processing: {dashboardData.performance.overall.averageProcessingTime} days avg
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Compliance Status
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.compliance.status}
                  </Typography>
                  <Typography variant="body2" color={dashboardData.compliance.score >= 90 ? 'success.main' : 'warning.main'}>
                    {dashboardData.compliance.score}% score
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: dashboardData.compliance.score >= 90 ? 'success.main' : 'warning.main' }}>
                  <Assessment />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Active Jobs" icon={<Work />} />
          <Tab label="Candidate Pipeline" icon={<People />} />
          <Tab label="Performance" icon={<Assessment />} />
          <Tab label="Compliance" icon={<CheckCircle />} />
        </Tabs>

        <CardContent>
          {/* Active Jobs Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Job Postings
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Applications</TableCell>
                    <TableCell>Conversion Rate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.jobs.jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{job.title}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>{job.category}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>
                        <Badge badgeContent={job.applications} color="primary">
                          <People />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          {job.conversionRate}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.status}
                          color={getStatusColor(job.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Candidate Pipeline Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Candidate Pipeline
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell>Profile Score</TableCell>
                    <TableCell>Days in Stage</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.pipeline.candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2 }}>
                            {candidate.full_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {candidate.full_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {candidate.experience_years} years experience
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{candidate.job_title}</TableCell>
                      <TableCell>
                        <Chip
                          label={candidate.step_name.replace('_', ' ')}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LinearProgress
                            variant="determinate"
                            value={candidate.profileScore}
                            sx={{ width: 60, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {candidate.profileScore}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{candidate.days_in_stage || 0}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Schedule Interview">
                          <IconButton size="small">
                            <Schedule />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Message">
                          <IconButton size="small">
                            <Message />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Performance Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Weekly Application Trends
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dashboardData.performance.weeklyMetrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line type="monotone" dataKey="applications" stroke="#8884d8" name="Applications" />
                          <Line type="monotone" dataKey="approvals" stroke="#82ca9d" name="Approvals" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Approval Rate Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Approved', value: dashboardData.performance.overall.approvalRate },
                              { name: 'Rejected', value: 100 - dashboardData.performance.overall.approvalRate }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            <Cell fill="#4caf50" />
                            <Cell fill="#f44336" />
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Compliance Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Compliance Status
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        Overall Compliance Score
                      </Typography>
                      <Box display="flex" alignItems="center" mt={2}>
                        <CircularProgress
                          variant="determinate"
                          value={dashboardData.compliance.score}
                          size={100}
                          thickness={4}
                        />
                        <Box ml={3}>
                          <Typography variant="h3">
                            {dashboardData.compliance.score}%
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {dashboardData.compliance.status}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Compliance Requirements
                      </Typography>
                      {dashboardData.compliance.requirements?.map((req, index) => (
                        <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">{req.name}</Typography>
                          <Chip
                            label={req.status}
                            color={req.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Post New Job Dialog */}
      <Dialog 
        open={postJobDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid #E0E0E0',
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
            Post New Job
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title *"
                value={jobForm.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!formErrors.title}
                helperText={formErrors.title}
                placeholder="e.g., Construction Worker"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name *"
                value={jobForm.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                error={!!formErrors.company}
                helperText={formErrors.company}
                placeholder="Your company name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location *"
                value={jobForm.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                error={!!formErrors.location}
                helperText={formErrors.location}
                placeholder="e.g., Tel Aviv, Israel"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salary Range *"
                value={jobForm.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                error={!!formErrors.salary}
                helperText={formErrors.salary}
                placeholder="e.g., ₹80,000 - ₹1,20,000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Experience Required"
                value={jobForm.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="e.g., 2-5 years"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobForm.type}
                  label="Job Type"
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <MenuItem value="Full-time">Full-time</MenuItem>
                  <MenuItem value="Part-time">Part-time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Remote">Remote</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.category}>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={jobForm.category}
                  label="Category *"
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <MenuItem value="Construction">Construction</MenuItem>
                  <MenuItem value="Healthcare">Healthcare</MenuItem>
                  <MenuItem value="Agriculture">Agriculture</MenuItem>
                  <MenuItem value="Hospitality">Hospitality</MenuItem>
                  <MenuItem value="IT Support">IT Support</MenuItem>
                  <MenuItem value="Nursing">Nursing</MenuItem>
                  <MenuItem value="Plumber">Plumber</MenuItem>
                  <MenuItem value="Electrician">Electrician</MenuItem>
                  <MenuItem value="Carpenter">Carpenter</MenuItem>
                  <MenuItem value="Driver">Driver</MenuItem>
                  <MenuItem value="Security Guard">Security Guard</MenuItem>
                </Select>
                {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Openings"
                value={jobForm.openings}
                onChange={(e) => handleInputChange('openings', e.target.value)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Job Description *"
                value={jobForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!formErrors.description}
                helperText={formErrors.description}
                placeholder="Describe the job role, responsibilities, and what you're looking for..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Requirements (comma-separated)"
                value={jobForm.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="e.g., Minimum 2 years experience, Valid work permit, Physical fitness certificate"
                helperText="Separate multiple requirements with commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #E0E0E0' }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#666' }}>
            Cancel
          </Button>
          <Button
            onClick={handlePostJob}
            variant="contained"
            startIcon={<Add />}
            sx={{
              bgcolor: '#7B0FF5',
              '&:hover': {
                bgcolor: '#9D4EDD',
              },
            }}
          >
            Post Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IsraeliEmployerDashboard;
