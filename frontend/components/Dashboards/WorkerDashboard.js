import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button,
  LinearProgress, Chip, Avatar, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableHead, TableRow,
  Badge, Alert, Tab, Tabs, CircularProgress,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Menu, MenuItem, Switch, FormControlLabel,
} from '@mui/material';
import {
  Work, School, Schedule, CheckCircle, Warning,
  TrendingUp, AttachMoney, Timeline, Assessment, GetApp,
  CloudUpload, Notifications, Settings, VerifiedUser,
  LocationOn, Close, Download, FileDownload, TableChart,
} from '@mui/icons-material';
import WorkerSafetyDashboard from '../Safety/WorkerSafetyDashboard';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';

const WorkerDashboard = ({ initialTab = 0 }) => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    location: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [applicationStatuses, setApplicationStatuses] = useState(new Map()); // Map of jobId -> status
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportMenuAnchor, setReportMenuAnchor] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update activeTab when initialTab prop changes (from URL query)
  useEffect(() => {
    if (initialTab !== undefined && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    fetchDashboardData();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, 180000); // 3 min refresh
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    // Load jobs when viewing Applications tab (tab 1) or Find Jobs tab (tab 2)
    if (activeTab === 1 || activeTab === 2) {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboards/worker');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch worker dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Keep profile form in sync with fetched dashboard profile
  useEffect(() => {
    const p = dashboardData?.profile;
    if (!p) return;
    setProfileForm({
      fullName: p.fullName || '',
      phone: p.phone || '',
      location: p.location || '',
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactPhone: p.emergencyContactPhone || '',
    });
  }, [dashboardData?.profile]);

  const saveProfile = async () => {
    try {
      setProfileSaving(true);
      setProfileSaveError('');
      setProfileSaveSuccess('');

      // Update core user fields in users table
      await api.put('/auth/me', {
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        address: profileForm.location,
      });

      // Store emergency contact in worker_profiles JSON (merge on server)
      await api.put('/auth/worker-profile', {
        emergencyContactName: profileForm.emergencyContactName,
        emergencyContactPhone: profileForm.emergencyContactPhone,
      });

      setProfileSaveSuccess('Profile updated successfully');
      await fetchDashboardData();
    } catch (e) {
      console.error('Failed to save profile:', e);
      setProfileSaveError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await api.get('/jobs/all');
      if (response.data.success) {
        let jobsList = response.data.data.jobs || [];
        
        // Debug logging to help identify issues
        console.log('[WorkerDashboard] Fetched jobs from API:', {
          totalJobs: jobsList.length,
          apiUrl: api.defaults.baseURL,
          jobIds: jobsList.map(j => j.id).sort((a, b) => a - b).slice(0, 10)
        });
        
        // Set all jobs returned from API
        setJobs(jobsList);
        
        // Fetch user's applications to check which jobs are applied and their statuses
        try {
          const user = typeof window !== 'undefined' 
            ? JSON.parse(localStorage.getItem('user') || '{}')
            : null;
          
          if (user && user.id) {
            const appsResponse = await api.get(`/applications/all?userId=${user.id}`);
            if (appsResponse.data.success) {
              const appliedIds = new Set();
              const statusMap = new Map();
              
              appsResponse.data.data
                .filter(app => app.jobId)
                .forEach(app => {
                  const jobIdStr = app.jobId.toString();
                  appliedIds.add(jobIdStr);
                  statusMap.set(jobIdStr, app.status || 'submitted');
                });
              
              setAppliedJobIds(appliedIds);
              setApplicationStatuses(statusMap);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user applications:', error);
        }
      }
    } catch (error) {
      console.error('[WorkerDashboard] Failed to fetch jobs:', {
        error: error.message,
        response: error.response?.data,
        apiUrl: api.defaults.baseURL,
        fullError: error
      });
    } finally {
      setJobsLoading(false);
    }
  };

  const handleApply = (jobId) => {
    // Navigate to application form with job ID
    if (typeof window !== 'undefined') {
      window.location.href = `/apply/${jobId}`;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'verified': 'success',
      'pending': 'warning',
      'rejected': 'error',
      'missing': 'error',
      'approved': 'success',
      'submitted': 'info',
      'under_review': 'warning',
      'interviewed': 'info'
    };
    return colors[status] || 'default';
  };

  const handleDownloadReport = (format) => {
    setDownloadingReport(true);
    setReportMenuAnchor(null);

    try {
      if (!dashboardData) {
        alert('No data available to download');
        setDownloadingReport(false);
        return;
      }

      const reportData = {
        profile: dashboardData.profile,
        applications: dashboardData.applications?.applications || [],
        documents: dashboardData.documents?.documents || [],
        skills: dashboardData.skills,
        timeline: dashboardData.timeline,
        generatedAt: new Date().toISOString(),
      };

      if (format === 'csv') {
        // Generate CSV
        const csvRows = [];
        
        // Profile section
        csvRows.push('PROFILE INFORMATION');
        csvRows.push('Field,Value');
        csvRows.push(`Full Name,${reportData.profile?.fullName || ''}`);
        csvRows.push(`Email,${reportData.profile?.email || ''}`);
        csvRows.push(`Phone,${reportData.profile?.phone || ''}`);
        csvRows.push(`Location,${reportData.profile?.location || ''}`);
        csvRows.push(`Experience,${reportData.profile?.experience || 0} years`);
        csvRows.push(`Skills,"${(reportData.profile?.skills || []).join('; ')}"`);
        csvRows.push('');
        
        // Applications section
        csvRows.push('APPLICATIONS');
        csvRows.push('Job Title,Company,Status,Applied Date,Progress');
        (reportData.applications || []).forEach(app => {
          csvRows.push(`"${app.title || ''}","${app.company_name || ''}","${app.status || ''}","${app.applied_at || ''}","${app.progress || 0}%"`);
        });
        csvRows.push('');
        
        // Skills section
        csvRows.push('SKILLS & ASSESSMENT');
        csvRows.push('Skill Score,Experience Years');
        csvRows.push(`${reportData.skills?.skillScore || 0}%,${reportData.skills?.currentSkills?.experience_years || 0}`);
        csvRows.push('');
        csvRows.push('Current Skills');
        (reportData.skills?.currentSkills?.skills || []).forEach(skill => {
          csvRows.push(skill);
        });
        csvRows.push('');
        csvRows.push('Languages');
        (reportData.skills?.currentSkills?.languages || []).forEach(lang => {
          csvRows.push(lang);
        });
        csvRows.push('');
        csvRows.push('Certifications');
        (reportData.skills?.currentSkills?.certifications || []).forEach(cert => {
          csvRows.push(cert);
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `worker_dashboard_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'json') {
        // Generate JSON
        const jsonContent = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `worker_dashboard_report_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleReportMenuClick = (event) => {
    setReportMenuAnchor(event.currentTarget);
  };

  const handleReportMenuClose = () => {
    setReportMenuAnchor(null);
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.dashboard', 'My Dashboard')}</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={downloadingReport ? <CircularProgress size={16} /> : <GetApp />}
            onClick={handleReportMenuClick}
            disabled={downloadingReport || !dashboardData}
          >
            {t('common.downloadReport', 'Download Report')}
          </Button>
          <Menu
            anchorEl={reportMenuAnchor}
            open={Boolean(reportMenuAnchor)}
            onClose={handleReportMenuClose}
          >
            <MenuItem onClick={() => handleDownloadReport('csv')}>
              <FileDownload sx={{ mr: 1 }} />
              Download as CSV
            </MenuItem>
            <MenuItem onClick={() => handleDownloadReport('json')}>
              <TableChart sx={{ mr: 1 }} />
              Download as JSON
            </MenuItem>
          </Menu>
          <Button
            variant="contained"
            startIcon={<Settings />}
            onClick={() => setSettingsOpen(true)}
          >
            {t('common.settings', 'Settings')}
          </Button>
        </Box>
      </Box>

      {/* Welcome Section */}
      <Grid item xs={12} mb={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Grid container alignItems="center" spacing={3}>
              <Grid item>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'white', color: 'primary.main' }}>
                  {(dashboardData.profile?.fullName || 'W').charAt(0)}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h4">{t('common.welcomeBack', 'Welcome back')}, {dashboardData.profile?.fullName || 'Worker'}!</Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {dashboardData.profile?.skills?.length ?? 0} {t('form.fields.languages', 'skills')} • {dashboardData.profile?.experience ?? 0} {t('common.yearsExperience', 'years experience')}
                </Typography>
                <Box display="flex" gap={2} mt={1}>
                  <Chip
                    label={`${dashboardData.timeline?.overallProgress ?? 0}% ${t('common.complete', 'Complete')}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip
                    label={`${t('common.skillScore', 'Skill Score')}: ${dashboardData.skills?.skillScore ?? 0}%`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                  startIcon={<Work />}
                  onClick={() => setActiveTab(2)}
                >
                  {t('common.findJobs', 'Find Jobs')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Work color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{dashboardData.applications?.active ?? 0}</Typography>
              <Typography variant="body2" color="textSecondary">{t('common.activeApplications', 'Active Applications')}</Typography>
              <Typography variant="caption" color="success.main">
                {dashboardData.applications?.approved ?? 0} {t('common.approved', 'approved')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{dashboardData.timeline?.currentStep?.replace('_', ' ') || 'Not Started'}</Typography>
              <Typography variant="body2" color="textSecondary">{t('common.currentStage', 'Current Stage')}</Typography>
              <Typography variant="caption" color="textSecondary">
                {dashboardData.timeline?.overallProgress ?? 0}% {t('common.complete', 'complete')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{dashboardData.documents?.verified ?? 0}</Typography>
              <Typography variant="body2" color="textSecondary">{t('common.verifiedDocuments', 'Verified Documents')}</Typography>
              <Typography variant="caption" color="warning.main">
                {dashboardData.documents?.pending ?? 0} {t('common.pending', 'pending')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{dashboardData.skills?.skillScore ?? 0}%</Typography>
              <Typography variant="body2" color="textSecondary">{t('common.skillScore', 'Skill Score')}</Typography>
              <Typography variant="caption" color="textSecondary">
                {t('common.marketReady', 'Market ready')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        indicatorColor="primary"
        textColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label={t('common.overview', 'Overview')} icon={<Assessment />} />
        <Tab label={t('common.myApplications', 'My Applications')} icon={<Work />} />
        <Tab label={t('common.findJobs', 'Find Jobs')} icon={<Work />} />
        <Tab label={t('common.documents', 'Documents')} icon={<GetApp />} />
        <Tab label={t('common.skillsLearning', 'Skills & Learning')} icon={<School />} />
        <Tab label={t('common.safetyWelfare', 'Safety & Welfare')} icon={<VerifiedUser />} />
        <Tab label={t('common.myProfile', 'My Profile')} icon={<Avatar />} />
        <Tab label={t('common.timeline', 'Timeline')} icon={<Timeline />} />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('common.applicationTimeline', 'Application Timeline')}</Typography>
                <Stepper activeStep={dashboardData.timeline?.currentStepIndex ?? 0} orientation="vertical">
                  {(dashboardData.timeline?.milestones ?? []).map((milestone, index) => (
                    <Step key={index}>
                      <StepLabel
                        optional={
                          milestone.completed ? (
                            <Typography variant="caption">{milestone.completedAt}</Typography>
                          ) : (
                            <Typography variant="caption">{milestone.estimatedDate}</Typography>
                          )
                        }
                      >
                        {milestone.title}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('common.recentNotifications', 'Recent Notifications')}</Typography>
                {(dashboardData.notifications ?? []).slice(0, 5).map((notification, index) => (
                  <Box key={index} mb={2}>
                    <Typography variant="subtitle2">{notification.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {notification.message}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Applications Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t('common.myApplications', 'My Applications')}</Typography>
            {(dashboardData.applications?.applications ?? []).length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t('common.youHaveNotSubmitted', 'You have not submitted any applications yet. Go to the')} <strong>{t('common.findJobs', 'Find Jobs')}</strong> {t('common.tabToBrowse', 'tab to browse and apply.')}
              </Alert>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('common.jobTitle', 'Job Title')}</TableCell>
                    <TableCell>{t('common.company', 'Company')}</TableCell>
                    <TableCell>{t('common.status', 'Status')}</TableCell>
                    <TableCell>{t('common.progress', 'Progress')}</TableCell>
                    <TableCell>{t('common.appliedDate', 'Applied Date')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(dashboardData.applications?.applications ?? []).map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>{application.title}</TableCell>
                      <TableCell>{application.company_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={application.status}
                          color={getStatusColor(application.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LinearProgress
                            variant="determinate"
                            value={application.progress}
                            sx={{ width: 100, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {application.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Find Jobs Tab */}
      {activeTab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" gutterBottom>
              {t('common.findJobs', 'Find Jobs')}
            </Typography>
            <Chip
              label={`${jobs.length} ${t('common.jobsAvailable', 'jobs available')}`}
              color="primary"
              variant="outlined"
            />
          </Box>

          {jobsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
            </Box>
          ) : jobs.length === 0 ? (
            <Alert severity="info">{t('common.noJobsAvailable', 'No jobs available at the moment. Please check back later.')}</Alert>
          ) : (
            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Grid item xs={12} md={6} lg={4} key={job.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="start" mb={2}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            mr: 2,
                            width: 56,
                            height: 56,
                          }}
                        >
                          <Work />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {job.company}
                          </Typography>
                        </Box>
                      </Box>

                      <Box mb={2}>
                        <Chip
                          label={job.category}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={job.type || 'Full-time'}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        {job.openings && (
                          <Chip
                            label={`${job.openings} openings`}
                            size="small"
                            sx={{ mb: 1 }}
                            color="success"
                          />
                        )}
                      </Box>

                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {job.location}
                        </Typography>
                      </Box>

                      {job.salary && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          💰 {job.salary}
                        </Typography>
                      )}

                      {job.experience && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          ⏱️ {job.experience}
                        </Typography>
                      )}

                      {job.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 2,
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {job.description}
                        </Typography>
                      )}

                      {job.posted && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                          Posted {job.posted}
                        </Typography>
                      )}
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      {appliedJobIds.has(job.id.toString()) ? (
                        <Box>
                          <Button
                            fullWidth
                            variant="outlined"
                            color={getStatusColor(applicationStatuses.get(job.id.toString()) || 'submitted')}
                            startIcon={<CheckCircle />}
                            disabled
                            sx={{
                              py: 1.5,
                              fontWeight: 600,
                              mb: 1,
                            }}
                          >
                            {applicationStatuses.get(job.id.toString()) === 'submitted' ? t('common.applicationSubmitted', 'Application Submitted') :
                             applicationStatuses.get(job.id.toString()) === 'under_review' ? t('common.underReview', 'Under Review') :
                             applicationStatuses.get(job.id.toString()) === 'approved' ? t('common.approved', 'Approved') :
                             applicationStatuses.get(job.id.toString()) === 'rejected' ? t('common.rejected', 'Rejected') :
                             t('common.applicationComplete', 'Application Complete')}
                          </Button>
                          <Typography variant="caption" color="text.secondary" align="center" display="block">
                            Status: {applicationStatuses.get(job.id.toString()) || 'submitted'}
                          </Typography>
                        </Box>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={<Work />}
                          onClick={() => handleApply(job.id)}
                          sx={{
                            py: 1.5,
                            fontWeight: 600,
                          }}
                        >
                          {t('common.applyNow', 'Apply Now')}
                        </Button>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Documents Tab - stored docs from applications (passport, certificates, work photos) */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('common.documentStatus', 'Document Status')}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {t('common.documents', 'Documents')} uploaded with your applications. Stored and shown here.
                </Typography>
                <Grid container spacing={2}>
                  {(dashboardData.documents?.documents ?? []).map((doc, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="subtitle2">{doc.name}</Typography>
                              <Chip
                                label={doc.status}
                                color={getStatusColor(doc.status)}
                                size="small"
                              />
                            </Box>
                            {doc.status === 'missing' && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CloudUpload />}
                                onClick={() => window.location.href = '/apply'}
                              >
                                {t('common.upload', 'Upload')}
                              </Button>
                            )}
                            {doc.status === 'verified' && (
                              <CheckCircle color="success" />
                            )}
                          </Box>
                          {doc.description && (
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                              {doc.description}
                            </Typography>
                          )}
                          {doc.files && doc.files.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {doc.files.map((f, i) => (
                                <Button
                                  key={i}
                                  size="small"
                                  component="a"
                                  href={f.url?.startsWith('http') ? f.url : `${(api.defaults.baseURL || '').replace(/\/api\/?$/, '') || 'http://localhost:5000'}${f.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ display: 'block', textAlign: 'left', textTransform: 'none' }}
                                >
                                  {f.name || 'View document'}
                                </Button>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Skills & Learning Tab - Enhanced Version */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          {/* Skill Assessment Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  {t('common.skillAssessment', 'Skill Assessment')}
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column">
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={dashboardData.skills?.skillScore ?? 0}
                      size={160}
                      thickness={6}
                      sx={{
                        color: (theme) => {
                          const score = dashboardData.skills?.skillScore ?? 0;
                          if (score >= 80) return theme.palette.success.main;
                          if (score >= 60) return theme.palette.warning.main;
                          return theme.palette.error.main;
                        },
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography variant="h3" component="div" color="text.primary" sx={{ fontWeight: 700 }}>
                        {dashboardData.skills?.skillScore ?? 0}%
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                        Score
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="textSecondary" sx={{ mt: 2, fontWeight: 600 }}>
                    {t('common.marketReadyScore', 'Market Ready Score')}
                  </Typography>
                  <Chip
                    label={
                      (dashboardData.skills?.skillScore ?? 0) >= 80 ? 'Excellent' :
                      (dashboardData.skills?.skillScore ?? 0) >= 60 ? 'Good' :
                      (dashboardData.skills?.skillScore ?? 0) >= 40 ? 'Fair' : 'Needs Improvement'
                    }
                    color={
                      (dashboardData.skills?.skillScore ?? 0) >= 80 ? 'success' :
                      (dashboardData.skills?.skillScore ?? 0) >= 60 ? 'warning' : 'error'
                    }
                    sx={{ mt: 1, fontWeight: 600 }}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Experience Summary */}
                {dashboardData.skills?.currentSkills?.experience_years > 0 && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                      {dashboardData.skills?.currentSkills?.experience_years}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.contrastText', opacity: 0.9 }}>
                      {dashboardData.skills?.currentSkills?.experience_years === 1 ? 'Year' : 'Years'} of Experience
                    </Typography>
                  </Box>
                )}

                {/* Quick Stats */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {(dashboardData.skills?.currentSkills?.skills ?? []).length}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Skills
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {(dashboardData.skills?.currentSkills?.languages ?? []).length}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Languages
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {(dashboardData.skills?.currentSkills?.certifications ?? []).length}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Certifications
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {dashboardData.applications?.total ?? 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Applications
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Skills & Languages Section */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  {t('common.currentSkills', 'Current Skills')}
                </Typography>
                {(dashboardData.skills?.currentSkills?.skills ?? []).length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    {(dashboardData.skills?.currentSkills?.skills ?? []).map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          mr: 1, 
                          mb: 1,
                          fontSize: '0.95rem',
                          height: '36px',
                          fontWeight: 500,
                        }}
                        icon={<Work />}
                      />
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No skills specified yet. Update your profile or submit an application to add skills.
                  </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Languages Section */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Languages
                </Typography>
                {(dashboardData.skills?.currentSkills?.languages ?? []).length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    {(dashboardData.skills?.currentSkills?.languages ?? []).map((lang, index) => (
                      <Chip
                        key={index}
                        label={lang}
                        color="info"
                        sx={{ 
                          mr: 1, 
                          mb: 1,
                          fontSize: '0.95rem',
                          height: '36px',
                          fontWeight: 500,
                        }}
                        icon={<LocationOn />}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    No languages specified
                  </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Certifications Section */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Certifications & Qualifications
                </Typography>
                {(dashboardData.skills?.currentSkills?.certifications ?? []).length > 0 ? (
                  <Box>
                    {(dashboardData.skills?.currentSkills?.certifications ?? []).map((cert, index) => (
                      <Card
                        key={index}
                        variant="outlined"
                        sx={{
                          mb: 2,
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.3s',
                          '&:hover': {
                            boxShadow: 2,
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <CheckCircle color="success" sx={{ mr: 2, fontSize: 32 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {cert}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Verified Certificate
                          </Typography>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">
                    No certifications added yet. You can add certifications when submitting job applications.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Skill Breakdown & Details */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  Skill Breakdown
                </Typography>
                <Grid container spacing={3}>
                  {/* Job Categories */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                        Job Categories Applied
                      </Typography>
                      {(dashboardData.skills?.currentSkills?.skills ?? []).filter(skill => 
                        !skill.includes('years') && 
                        !(dashboardData.skills?.currentSkills?.languages ?? []).includes(skill)
                      ).length > 0 ? (
                        <Box>
                          {(dashboardData.skills?.currentSkills?.skills ?? []).filter(skill => 
                            !skill.includes('years') && 
                            !(dashboardData.skills?.currentSkills?.languages ?? []).includes(skill)
                          ).map((category, index) => (
                            <Chip
                              key={index}
                              label={category}
                              color="primary"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No job categories specified
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Application Status Summary */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                        Application Status
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Total Applications</Typography>
                          <Chip label={dashboardData.applications?.total ?? 0} size="small" />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Active</Typography>
                          <Chip label={dashboardData.applications?.active ?? 0} color="info" size="small" />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Approved</Typography>
                          <Chip label={dashboardData.applications?.approved ?? 0} color="success" size="small" />
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Rejected</Typography>
                          <Chip label={dashboardData.applications?.rejected ?? 0} color="error" size="small" />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Safety & Welfare Tab */}
      {activeTab === 5 && dashboardData && (
        <Box sx={{ p: 3 }}>
          <WorkerSafetyDashboard workerId={dashboardData.workerId || dashboardData.profile?.id || '1'} />
        </Box>
      )}

      {/* My Profile Tab */}
      {activeTab === 6 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('common.personalInformation', 'Personal Information')}</Typography>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                  <TextField
                    label={t('form.fields.fullName', 'Full Name')}
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm((s) => ({ ...s, fullName: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label={t('form.fields.email', 'Email')}
                    value={dashboardData.profile?.email || ''}
                    fullWidth
                    disabled
                  />
                  <TextField
                    label={t('form.fields.phone', 'Phone')}
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((s) => ({ ...s, phone: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label={t('form.fields.location', 'Location')}
                    value={profileForm.location}
                    onChange={(e) => setProfileForm((s) => ({ ...s, location: e.target.value }))}
                    fullWidth
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('common.emergencyContact', 'Emergency Contact')}</Typography>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                  <TextField
                    label={t('common.contactName', 'Contact Name')}
                    value={profileForm.emergencyContactName}
                    onChange={(e) => setProfileForm((s) => ({ ...s, emergencyContactName: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label={t('common.contactPhone', 'Contact Phone')}
                    value={profileForm.emergencyContactPhone}
                    onChange={(e) => setProfileForm((s) => ({ ...s, emergencyContactPhone: e.target.value }))}
                    fullWidth
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>{t('common.professionalInformation', 'Professional Information')}</Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  <Chip
                    icon={<Schedule />}
                    label={`${t('common.yearsExperience', 'Years Experience')}: ${dashboardData.profile?.experience ?? 0}`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<Assessment />}
                    label={`${t('common.skillScore', 'Skill Score')}: ${dashboardData.skills?.skillScore ?? 0}%`}
                    variant="outlined"
                  />
                </Box>

                <Typography variant="subtitle2" gutterBottom>{t('common.skills', 'Skills')}</Typography>
                <Box>
                  {(dashboardData.profile?.skills ?? []).length > 0 ? (
                    (dashboardData.profile?.skills ?? []).map((skill, index) => (
                      <Chip key={index} label={skill} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">—</Typography>
                  )}
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const p = dashboardData?.profile;
                      setProfileSaveError('');
                      setProfileSaveSuccess('');
                      setProfileForm({
                        fullName: p?.fullName || '',
                        phone: p?.phone || '',
                        location: p?.location || '',
                        emergencyContactName: p?.emergencyContactName || '',
                        emergencyContactPhone: p?.emergencyContactPhone || '',
                      });
                    }}
                    disabled={profileSaving}
                  >
                    {t('common.reset', 'Reset')}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={saveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  </Button>
                </Box>
                {profileSaveError && <Alert severity="error" sx={{ mt: 2 }}>{profileSaveError}</Alert>}
                {profileSaveSuccess && <Alert severity="success" sx={{ mt: 2 }}>{profileSaveSuccess}</Alert>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Timeline Tab */}
      {activeTab === 7 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t('common.applicationTimeline', 'Application Timeline')}</Typography>
            <Stepper activeStep={dashboardData.timeline?.currentStepIndex ?? 0} alternativeLabel>
              {(dashboardData.timeline?.milestones ?? []).map((milestone, index) => (
                <Step key={index}>
                  <StepLabel
                    optional={
                      milestone.completed ? (
                        <Typography variant="caption">{milestone.completedAt}</Typography>
                      ) : (
                        <Typography variant="caption">{milestone.estimatedDate}</Typography>
                      )
                    }
                  >
                    {milestone.title}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid #E0E0E0'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('common.settings', 'Settings')}
          </Typography>
          <IconButton
            onClick={() => setSettingsOpen(false)}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => {
                    setAutoRefresh(e.target.checked);
                    if (e.target.checked) {
                      fetchDashboardData();
                    }
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Auto-refresh Dashboard
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Automatically refresh dashboard data every 3 minutes
                  </Typography>
                </Box>
              }
            />
            <Divider />
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                Dashboard Preferences
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Customize your dashboard experience. Changes are saved automatically.
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                Data & Privacy
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Your data is securely stored and only accessible to you and authorized administrators.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  alert('Data export feature coming soon!');
                }}
              >
                Export All Data
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #E0E0E0' }}>
          <Button onClick={() => setSettingsOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerDashboard;
