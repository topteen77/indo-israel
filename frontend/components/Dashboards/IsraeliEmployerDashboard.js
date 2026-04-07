import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Grid, Card, CardContent, Typography, Box, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, LinearProgress, IconButton,
  Badge, Tooltip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  FormHelperText, Snackbar,
} from '@mui/material';
import {
  Work, People, Assessment, CheckCircle,
  Warning, Visibility, Edit,
  TrendingUp, Close, Add,
  Dashboard, PersonAdd, PersonAddOutlined, DesktopMac, Gavel, MenuBook,
  VerifiedUser,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../utils/api';
import DashboardShell from '../Layout/DashboardShell';

function employerCandidateBand(c) {
  const st = String(c.status || '').toLowerCase();
  if (st === 'rejected') return { label: 'Reassess', color: 'default' };
  const sc = Number(c.profileScore) || 0;
  if (sc >= 85) return { label: 'Premium', color: 'success' };
  if (sc >= 70) return { label: 'Deployable', color: 'primary' };
  if (sc >= 50) return { label: 'Train', color: 'warning' };
  return { label: 'Hold', color: 'default' };
}

function employerStatusChipColor(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'error';
  if (s === 'interviewed') return 'info';
  if (s === 'under_review' || s === 'submitted') return 'warning';
  return 'primary';
}

function employerFraudMeter(riskLevel) {
  const r = String(riskLevel?.level || 'low').toLowerCase();
  if (r === 'high') return { value: 88, label: 'High', color: 'error' };
  if (r === 'medium') return { value: 52, label: 'Med', color: 'warning' };
  return { value: 18, label: 'Low', color: 'success' };
}

const IsraeliEmployerDashboard = () => {
  const router = useRouter();
  const [shellUser, setShellUser] = useState({ display: '', role: 'employer' });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setShellUser({
        display: u.fullName || u.name || u.email || u.companyName || 'Employer',
        role: u.role || 'employer',
      });
    } catch (_) {
      setShellUser({ display: 'Employer', role: 'employer' });
    }
  }, []);

  const employerTabTitle = (tab) =>
    (
      {
        0: 'Recruitment Dashboard',
        1: 'Active Jobs',
        2: 'Candidate Pipeline',
        3: 'Performance',
        4: 'Compliance',
      }[tab] ?? 'Dashboard'
    );

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [postJobDialogOpen, setPostJobDialogOpen] = useState(false);
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

  const employerNavGroups = useMemo(() => {
    const activeJobs = dashboardData?.jobs?.activeJobs ?? 0;
    const pipeCount = (dashboardData?.pipeline?.candidates ?? []).length;
    return [
      {
        section: 'Employer',
        items: [
          { id: 0, label: 'Dashboard', icon: <Dashboard /> },
          { id: 1, label: 'Active Jobs', icon: <Work />, ...(activeJobs ? { badge: activeJobs } : {}) },
          { id: 2, label: 'Candidate Pipeline', icon: <People />, ...(pipeCount ? { badge: pipeCount } : {}) },
          { id: 3, label: 'Performance', icon: <Assessment /> },
          { id: 4, label: 'Compliance', icon: <CheckCircle /> },
          { id: 5, label: 'Register candidate', icon: <PersonAddOutlined /> },
          { id: 6, label: 'Contracts', icon: <Gavel /> },
          { id: 7, label: 'Resources', icon: <MenuBook /> },
          { id: 8, label: 'Safety & Welfare', icon: <VerifiedUser /> },
        ],
      },
    ];
  }, [dashboardData]);

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
      if (Number.isFinite(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
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

  const accent = useMemo(
    () => ({
      blue: '#4285F4',
      green: '#34A853',
      purple: '#7B61FF',
      orange: '#FB8C00',
    }),
    []
  );

  const recruitmentWeekLabel = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const end = new Date(now);
    end.setDate(now.getDate() + daysUntilSunday);
    return end.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  const pipelineStatusRows = useMemo(() => {
    const dist = dashboardData?.pipeline?.stageDistribution ?? {};
    const entries = Object.entries(dist).filter(([, v]) => v > 0);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    const palette = [accent.green, accent.orange, accent.blue, accent.purple, '#9C27B0', '#00BCD4', '#E91E63'];
    if (total === 0) return [];
    return entries.map(([key, count], i) => ({
      key,
      label: key
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      count,
      pct: Math.round((count / total) * 1000) / 10,
      color: palette[i % palette.length],
    }));
  }, [dashboardData, accent]);

  const scoreDistributionBars = useMemo(() => {
    const cands = dashboardData?.pipeline?.candidates ?? [];
    const rows = [
      { name: 'Premium (85–100)', fill: accent.green, count: 0 },
      { name: 'Deployable (70–84)', fill: accent.blue, count: 0 },
      { name: 'Train then deploy', fill: accent.orange, count: 0 },
      { name: 'Rejected / reassess', fill: '#e53935', count: 0 },
    ];
    cands.forEach((c) => {
      const st = String(c.status || '').toLowerCase();
      const sc = Number(c.profileScore) || 0;
      if (st === 'rejected') rows[3].count += 1;
      else if (sc >= 85) rows[0].count += 1;
      else if (sc >= 70) rows[1].count += 1;
      else if (sc >= 50) rows[2].count += 1;
      else rows[3].count += 1;
    });
    return rows;
  }, [dashboardData, accent]);

  const employerHomeKpis = useMemo(() => {
    const cands = dashboardData?.pipeline?.candidates ?? [];
    const totalApps = dashboardData?.jobs?.totalApplications ?? 0;
    const deployable70 = cands.filter((c) => (Number(c.profileScore) || 0) >= 70).length;
    const progressed = cands.filter((c) => {
      const s = String(c.status || '').toLowerCase();
      const step = String(c.step_name || '').toLowerCase();
      return s === 'interviewed' || s === 'approved' || step.includes('interview');
    }).length;
    const flagged = cands.filter((c) => {
      const s = String(c.status || '').toLowerCase();
      const r = String(c.riskLevel?.level || 'low').toLowerCase();
      return s === 'rejected' || r === 'high' || r === 'medium';
    }).length;
    const passPct = totalApps > 0 ? Math.round((deployable70 / totalApps) * 1000) / 10 : 0;
    return [
      {
        label: 'Applications',
        value: totalApps,
        sub: 'Across open roles',
        trend: 'up',
        accent: accent.blue,
      },
      {
        label: 'Progressed',
        value: progressed,
        sub: 'Interview & beyond',
        trend: 'up',
        accent: accent.green,
      },
      {
        label: 'Deployable (70+)',
        value: deployable70,
        sub: `${passPct}% at target score`,
        trend: 'neutral',
        accent: accent.purple,
      },
      {
        label: 'Needs review',
        value: flagged,
        sub: flagged > 0 ? 'Risk or rejected' : 'All clear',
        trend: flagged > 0 ? 'warn' : 'neutral',
        accent: flagged > 0 ? '#e53935' : accent.orange,
      },
    ];
  }, [dashboardData, accent]);

  const handleEmployerNav = (id) => {
    if (id === 5) {
      router.push('/dashboard/employer/register');
      return;
    }
    if (id === 6) {
      router.push('/dashboard/employer/contracts');
      return;
    }
    if (id === 7) {
      router.push('/dashboard/employer/resources');
      return;
    }
    if (id === 8) {
      router.push('/dashboard/employer/safety');
      return;
    }
    setActiveTab(id);
  };

  const shellProps = {
    navGroups: employerNavGroups,
    activeId: activeTab,
    onNavSelect: handleEmployerNav,
    topbarTitle: employerTabTitle(activeTab),
    roleLabel: shellUser.role,
    userDisplayName: shellUser.display,
    onHome: () => router.push('/'),
    onLogout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    },
  };

  if (loading) {
    return (
      <DashboardShell {...shellProps}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
        </Box>
      </DashboardShell>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardShell {...shellProps}>
        <Alert severity="error">Failed to load dashboard data.</Alert>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell {...shellProps}>
      {activeTab === 0 ? (
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={2}
            mb={3}
          >
            <Box>
              <Typography variant="h4" component="h1" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: '#1e293b' }}>
                Recruitment Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Week ending {recruitmentWeekLabel}
                {' · '}
                {dashboardData?.profile?.companyName ?? 'Your company'}
              </Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setActiveTab(2)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: accent.blue,
                  boxShadow: '0 4px 14px rgba(66,133,244,0.35)',
                  '&:hover': { bgcolor: '#3367d6' },
                }}
              >
                Review candidates
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAddOutlined />}
                onClick={() => router.push('/dashboard/employer/register')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  borderColor: accent.green,
                  color: accent.green,
                }}
              >
                Register candidate
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setPostJobDialogOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: '#7B0FF5',
                  '&:hover': { bgcolor: '#9D4EDD' },
                }}
              >
                Post job
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2} mb={3}>
            {employerHomeKpis.map((k) => (
              <Grid item xs={12} sm={6} md={3} key={k.label}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid #e8eaf0',
                    height: '100%',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    borderLeft: '4px solid',
                    borderLeftColor: k.accent,
                  }}
                >
                  <CardContent sx={{ pt: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing="0.06em">
                      {k.label.toUpperCase()}
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ my: 0.75, lineHeight: 1.1, color: '#0f172a' }}>
                      {k.value}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                      {k.trend === 'up' ? (
                        <TrendingUp sx={{ fontSize: 18, color: accent.green }} />
                      ) : k.trend === 'warn' ? (
                        <Warning sx={{ fontSize: 18, color: '#e53935' }} />
                      ) : null}
                      <Typography variant="body2" color="text.secondary">
                        {k.sub}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={5}>
              <Card
                elevation={0}
                sx={{ borderRadius: 2, border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#1e293b' }}>
                    Pipeline by status
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Count and share of applicants by stage
                  </Typography>
                  {pipelineStatusRows.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary', bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2">No pipeline data yet.</Typography>
                    </Box>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e8eaf0' }}>
                            Status
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e8eaf0' }}>
                            Count
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e8eaf0' }}>
                            % Total
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pipelineStatusRows.map((row) => (
                          <TableRow key={row.key} hover sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell sx={{ borderBottom: '1px solid #f1f5f9' }}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: row.color,
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography variant="body2" fontWeight={600}>
                                  {row.label}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
                              {row.count}
                            </TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9', color: 'text.secondary' }}>
                              {row.pct}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={7}>
              <Card
                elevation={0}
                sx={{ borderRadius: 2, border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#1e293b' }}>
                    Score distribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Candidates by profile score band
                  </Typography>
                  {(dashboardData?.pipeline?.candidates ?? []).length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary', bgcolor: 'grey.50', borderRadius: 2 }}>
                      <DesktopMac sx={{ fontSize: 40, opacity: 0.35, mb: 1 }} />
                      <Typography variant="body2">No candidates to chart yet.</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        layout="vertical"
                        data={scoreDistributionBars}
                        margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8eaf0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={150}
                          tick={{ fontSize: 11, fill: '#475569' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e8eaf0' }}
                          formatter={(value) => [`${value}`, 'Count']}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                          {scoreDistributionBars.map((e) => (
                            <Cell key={e.name} fill={e.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card
            elevation={0}
            sx={{ borderRadius: 2, border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#1e293b' }}>
                Recent candidates
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Latest applicants linked to your job postings
              </Typography>
              <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>Candidate</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Trade</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>State</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b' }}>
                        Score
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Band</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b', minWidth: 100 }}>Fraud</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b' }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dashboardData?.pipeline?.candidates ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                          No candidates yet. Post a job to start receiving applications.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (dashboardData?.pipeline?.candidates ?? []).slice(0, 25).map((c) => {
                        const band = employerCandidateBand(c);
                        const fraud = employerFraudMeter(c.riskLevel);
                        const stageLabel = String(c.step_name || c.status || '—').replace(/_/g, ' ');
                        return (
                          <TableRow key={c.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {c.full_name || '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Applicant
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
                                APR-{String(c.id).padStart(6, '0')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{c.job_title || (c.skills && c.skills[0]) || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={stageLabel}
                                color={employerStatusChipColor(c.status)}
                                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700}>
                                {Number(c.profileScore ?? 0).toFixed(1)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={band.label} color={band.color} variant="outlined" sx={{ fontWeight: 600 }} />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ minWidth: 72 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={fraud.value}
                                  color={fraud.color}
                                  sx={{ height: 6, borderRadius: 3, mb: 0.25 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {fraud.label}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{ textTransform: 'none', mr: 0.5 }}
                                onClick={() => {
                                  const appId = c.applicationId ?? c.id;
                                  if (appId != null && String(appId).trim() !== '') {
                                    router.push(`/apply/${encodeURIComponent(String(appId))}`);
                                  }
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      ) : (
      <>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight={700}>
            Employer workspace
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {dashboardData?.profile?.companyName ?? 'Company'}
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

      {/* Main content (section from sidebar) */}
      <Card elevation={2}>
        <CardContent>
          {/* Active Jobs Tab */}
          {activeTab === 1 && (
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
          {activeTab === 2 && (
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
                        <Tooltip title="View candidate profile">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const appId = candidate.applicationId ?? candidate.id;
                              if (appId != null && String(appId).trim() !== '') {
                                router.push(`/apply/${encodeURIComponent(String(appId))}`);
                              }
                            }}
                          >
                            <Visibility />
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
          {activeTab === 3 && (
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
          {activeTab === 4 && (
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
      </>
      )}

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
    </DashboardShell>
  );
};

export default IsraeliEmployerDashboard;
