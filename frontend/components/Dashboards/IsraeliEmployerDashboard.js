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
  TrendingUp, Close, Add, AutoAwesome, Business,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../utils/api';
import dynamic from 'next/dynamic';

const AIJobGenerator = dynamic(
  () => import('../AI/AIJobGenerator'),
  { ssr: false }
);

const IsraeliEmployerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [postJobDialogOpen, setPostJobDialogOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [jobPostTab, setJobPostTab] = useState(0); // 0 = manual, 1 = AI generator
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewJobDialogOpen, setViewJobDialogOpen] = useState(false);
  const [editJobDialogOpen, setEditJobDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);
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
    
    // Check if we should open the post job dialog or switch tab (from homepage/footer)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shouldOpenPostJob = urlParams.get('openPostJob') === 'true' || 
                                sessionStorage.getItem('openPostJob') === 'true';
      const tabParam = urlParams.get('tab');
      const tabIndex = tabParam !== null && tabParam !== '' ? parseInt(tabParam, 10) : NaN;
      
      if (shouldOpenPostJob) {
        setPostJobDialogOpen(true);
        sessionStorage.removeItem('openPostJob');
      }
      if (Number.isFinite(tabIndex) && tabIndex >= 0 && tabIndex <= 3) {
        setActiveTab(tabIndex);
      }
      // Clean up URL if we had openPostJob or tab
      if (shouldOpenPostJob || (Number.isFinite(tabIndex) && tabIndex >= 0)) {
        const cleanSearch = new URLSearchParams(window.location.search);
        cleanSearch.delete('openPostJob');
        cleanSearch.delete('tab');
        const newSearch = cleanSearch.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
    
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
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
      const postedBy = user?.id || null;

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
        postedBy,
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Job posted successfully!',
          severity: 'success'
        });
        setPostJobDialogOpen(false);
        fetchDashboardData(); // Refresh dashboard with new job from DB
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

  const handleViewJob = async (jobId) => {
    try {
      setLoadingJob(true);
      const response = await api.get(`/jobs/${jobId}`);
      if (response.data.success) {
        setSelectedJob(response.data.data);
        setViewJobDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load job details',
        severity: 'error'
      });
    } finally {
      setLoadingJob(false);
    }
  };

  const handleEditJob = async (jobId) => {
    try {
      setLoadingJob(true);
      const response = await api.get(`/jobs/${jobId}`);
      if (response.data.success) {
        const job = response.data.data;
        setSelectedJob(job);
        setJobForm({
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          salary: job.salary || '',
          experience: job.experience || '',
          type: job.type || 'Full-time',
          description: job.description || '',
          requirements: Array.isArray(job.requirements) 
            ? job.requirements.join(', ') 
            : (job.requirements || ''),
          category: job.category || '',
          openings: job.openings || 1,
        });
        setEditJobDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load job details',
        severity: 'error'
      });
    } finally {
      setLoadingJob(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!validateForm() || !selectedJob) {
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

      const response = await api.put(`/jobs/${selectedJob.id}`, {
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
          message: 'Job updated successfully!',
          severity: 'success'
        });
        setEditJobDialogOpen(false);
        setSelectedJob(null);
        fetchDashboardData(); // Refresh dashboard
      }
    } catch (error) {
      console.error('Error updating job:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update job. Please try again.',
        severity: 'error'
      });
    }
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
            {dashboardData?.profile?.companyName ?? 'Company'}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Business />}
            onClick={() => window.location.href = '/merf'}
            sx={{
              borderColor: '#7B0FF5',
              color: '#7B0FF5',
              '&:hover': {
                borderColor: '#9D4EDD',
                bgcolor: 'rgba(123, 15, 245, 0.04)',
              },
            }}
          >
            MERF Requisitions
          </Button>
          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={() => setAiGeneratorOpen(true)}
            sx={{
              bgcolor: '#9c27b0',
              '&:hover': {
                bgcolor: '#7b1fa2',
              },
            }}
          >
            AI Job Generator
          </Button>
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
                    {dashboardData?.jobs?.activeJobs ?? 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{(dashboardData?.jobs?.totalJobs ?? 0) - (dashboardData?.jobs?.activeJobs ?? 0)} this month
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
                    {dashboardData?.jobs?.totalApplications ?? 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg: {dashboardData?.jobs?.averageApplications ?? 0} per job
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
                    {dashboardData?.performance?.overall?.approvalRate ?? 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Processing: {dashboardData?.performance?.overall?.averageProcessingTime ?? 0} days avg
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
                    {dashboardData?.compliance?.status ?? 'Compliant'}
                  </Typography>
                  <Typography variant="body2" color={(dashboardData?.compliance?.score ?? 0) >= 90 ? 'success.main' : 'warning.main'}>
                    {dashboardData?.compliance?.score ?? 0}% score
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
                  {(dashboardData?.jobs?.jobs ?? []).map((job) => (
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
                        <Tooltip title="View Job Details">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewJob(job.id)}
                            disabled={loadingJob}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Job">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditJob(job.id)}
                            disabled={loadingJob}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
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
                  {(dashboardData?.pipeline?.candidates ?? []).map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2 }}>
                            {(candidate.full_name || 'A').charAt(0)}
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
                        <Tooltip title="Conduct Interview Assessment">
                          <IconButton
                            size="small"
                            onClick={() => window.location.href = `/interviews/assess/${candidate.applicationId || candidate.id}`}
                          >
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
                        <LineChart data={dashboardData?.performance?.weeklyMetrics ?? []}>
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
                              { name: 'Approved', value: dashboardData?.performance?.overall?.approvalRate ?? 0 },
                              { name: 'Rejected', value: 100 - (dashboardData?.performance?.overall?.approvalRate ?? 0) }
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
                          value={dashboardData?.compliance?.score ?? 0}
                          size={100}
                          thickness={4}
                        />
                        <Box ml={3}>
                          <Typography variant="h3">
                            {dashboardData?.compliance?.score ?? 0}%
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
                      {(dashboardData?.compliance?.requirements ?? []).map((req, index) => (
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
        {jobPostTab === 0 && (
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
        )}
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

      {/* AI Job Generator Dialog */}
      <Dialog
        open={aiGeneratorOpen}
        onClose={() => setAiGeneratorOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid #E0E0E0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoAwesome />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              AI Job Post Generator
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setAiGeneratorOpen(false)} 
            size="small"
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: '#f5f5f5' }}>
          <AIJobGenerator
            onGenerated={(jobData) => {
              // Populate the job form with generated data
              setJobForm({
                title: jobData.title || '',
                company: jobData.company || dashboardData?.profile?.companyName || '',
                location: jobData.location || '',
                salary: jobData.salary || '',
                experience: jobData.experience || '',
                type: jobData.type || 'Full-time',
                description: jobData.description || '',
                requirements: Array.isArray(jobData.requirements) 
                  ? jobData.requirements.join(', ') 
                  : (jobData.requirements || ''),
                category: jobData.category || '',
                openings: jobData.openings || 1,
              });
              // Close AI generator and open the post job dialog
              setAiGeneratorOpen(false);
              setPostJobDialogOpen(true);
              setSnackbar({
                open: true,
                message: 'Job generated successfully! Please review and submit.',
                severity: 'success'
              });
            }}
            onClose={() => setAiGeneratorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Job Dialog */}
      <Dialog
        open={viewJobDialogOpen}
        onClose={() => {
          setViewJobDialogOpen(false);
          setSelectedJob(null);
        }}
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
            Job Details
          </Typography>
          <IconButton onClick={() => {
            setViewJobDialogOpen(false);
            setSelectedJob(null);
          }} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedJob ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedJob.title}
                </Typography>
                <Chip
                  label={selectedJob.status}
                  color={getStatusColor(selectedJob.status)}
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Company
                </Typography>
                <Typography variant="body1">{selectedJob.company}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Location
                </Typography>
                <Typography variant="body1">{selectedJob.location}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Salary
                </Typography>
                <Typography variant="body1">{selectedJob.salary}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Experience
                </Typography>
                <Typography variant="body1">{selectedJob.experience || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Job Type
                </Typography>
                <Typography variant="body1">{selectedJob.type}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Category
                </Typography>
                <Typography variant="body1">{selectedJob.category}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Openings
                </Typography>
                <Typography variant="body1">{selectedJob.openings}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Applications
                </Typography>
                <Typography variant="body1">{selectedJob.applications || 0}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedJob.description}
                </Typography>
              </Grid>
              {selectedJob.requirements && Array.isArray(selectedJob.requirements) && selectedJob.requirements.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Requirements
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedJob.requirements.map((req, index) => (
                      <Chip key={index} label={req} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">
                  Posted: {new Date(selectedJob.created_at).toLocaleString()}
                  {selectedJob.updated_at && selectedJob.updated_at !== selectedJob.created_at && (
                    <> | Updated: {new Date(selectedJob.updated_at).toLocaleString()}</>
                  )}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #E0E0E0' }}>
          <Button 
            onClick={() => {
              setViewJobDialogOpen(false);
              setSelectedJob(null);
            }}
            sx={{ color: '#666' }}
          >
            Close
          </Button>
          {selectedJob && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                setViewJobDialogOpen(false);
                handleEditJob(selectedJob.id);
              }}
              sx={{
                bgcolor: '#7B0FF5',
                '&:hover': {
                  bgcolor: '#9D4EDD',
                },
              }}
            >
              Edit Job
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog
        open={editJobDialogOpen}
        onClose={() => {
          setEditJobDialogOpen(false);
          setSelectedJob(null);
          setFormErrors({});
        }}
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
            Edit Job
          </Typography>
          <IconButton onClick={() => {
            setEditJobDialogOpen(false);
            setSelectedJob(null);
            setFormErrors({});
          }} size="small">
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
          <Button 
            onClick={() => {
              setEditJobDialogOpen(false);
              setSelectedJob(null);
              setFormErrors({});
            }}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateJob}
            variant="contained"
            startIcon={<Edit />}
            sx={{
              bgcolor: '#7B0FF5',
              '&:hover': {
                bgcolor: '#9D4EDD',
              },
            }}
          >
            Update Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IsraeliEmployerDashboard;
