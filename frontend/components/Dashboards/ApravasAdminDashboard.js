import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Grid, Card, CardContent, Typography, Box, Chip,
  LinearProgress, CircularProgress, Button, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  Alert, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Checkbox, FormControlLabel, Paper,
  InputAdornment, IconButton,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, People, Work, AttachMoney,
  Speed, CheckCircle, Schedule, Assessment,
  Visibility, VisibilityOff, Download, FilterList, Refresh, SafetyCheck, Chat,
  PersonAdd, Edit as EditIcon, Settings as SettingsIcon, Email as EmailIcon,
  Warning, BusinessCenter, Search,
} from '@mui/icons-material';
import AdminSafetyDashboard from '../Safety/AdminSafetyDashboard';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../utils/api';
import DashboardShell from '../Layout/DashboardShell';

const ApravasAdminDashboard = ({ initialTab }) => {
  const router = useRouter();
  const [shellUser, setShellUser] = useState({ display: '', role: 'admin' });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setShellUser({
        display: u.fullName || u.name || u.email || 'User',
        role: u.role || 'admin',
      });
    } catch (_) {
      setShellUser({ display: 'User', role: 'admin' });
    }
  }, []);

  const adminNavGroups = useMemo(
    () => [
      { section: 'Overview', items: [{ id: 0, label: 'Analytics', icon: <Assessment /> }] },
      {
        section: 'Operations',
        items: [
          { id: 1, label: 'Safety & Welfare', icon: <SafetyCheck /> },
          { id: 2, label: 'WhatsApp Log', icon: <Chat /> },
          { id: 5, label: 'Email Log', icon: <EmailIcon /> },
          { id: 6, label: 'Website errors', icon: <Warning /> },
          { id: 7, label: 'Live chat', icon: <Chat /> },
        ],
      },
      {
        section: 'Management',
        items: [
          { id: 3, label: 'Users', icon: <People /> },
          { id: 4, label: 'Jobs', icon: <BusinessCenter /> },
        ],
      },
      { section: 'System', items: [{ id: 8, label: 'Settings', icon: <SettingsIcon /> }] },
    ],
    []
  );

  const adminTabTitle = (tab) => {
    const m = {
      0: 'Analytics',
      1: 'Safety & Welfare',
      2: 'WhatsApp Log',
      3: 'Users',
      4: 'Jobs',
      5: 'Email Log',
      6: 'Website errors',
      7: 'Live chat',
      8: 'Settings',
    };
    return m[tab] ?? 'Dashboard';
  };

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Open a specific tab from URL (e.g. /dashboard/admin?tab=6 for Live chat)
  useEffect(() => {
    if (initialTab !== undefined && Number.isFinite(initialTab) && initialTab >= 0) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [whatsappLog, setWhatsappLog] = useState({ items: [], total: 0 });
  const [whatsappLogLoading, setWhatsappLogLoading] = useState(false);
  const [whatsappLogFilter, setWhatsappLogFilter] = useState({ status: '', type: '' });
  const [emailLog, setEmailLog] = useState({ items: [], total: 0 });
  const [emailLogLoading, setEmailLogLoading] = useState(false);
  const [emailLogFilter, setEmailLogFilter] = useState({ status: '', type: '' });
  // Users tab (admin: add/edit users)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [userDialogMode, setUserDialogMode] = useState(null); // 'add' | 'edit' | null
  const [userForm, setUserForm] = useState({ email: '', password: '', name: '', fullName: '', role: 'worker', companyName: '', phone: '', address: '', isDemoAccount: false, demoPassword: '' });
  const [userFormError, setUserFormError] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  // Settings tab (admin: third-party Email, WhatsApp, SMS, OpenAI, Website)
  const [tpSettings, setTpSettings] = useState({ email: {}, whatsapp: {}, sms: {}, openai: {}, website: {} });
  const [tpEdit, setTpEdit] = useState({ email: {}, whatsapp: {}, sms: {}, openai: {}, website: {} });
  const [tpLoading, setTpLoading] = useState(false);
  const [tpSaving, setTpSaving] = useState(false);
  const [tpError, setTpError] = useState('');
  const [showSecret, setShowSecret] = useState({});
  const toggleShowSecret = (fieldId) => {
    setShowSecret((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };
  // Live chat (agent handoff)
  const [waitingSessions, setWaitingSessions] = useState([]);
  const [waitingSessionsLoading, setWaitingSessionsLoading] = useState(false);
  const [joinedSessionId, setJoinedSessionId] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [sessionHandoff, setSessionHandoff] = useState(null);
  const [sessionMessagesLoading, setSessionMessagesLoading] = useState(false);
  const [agentMessageInput, setAgentMessageInput] = useState('');
  const [sendingAgentMessage, setSendingAgentMessage] = useState(false);
  const liveChatPollRef = useRef(null);
  const [websiteErrorsLoading, setWebsiteErrorsLoading] = useState(false);
  const [websiteErrorsData, setWebsiteErrorsData] = useState({ entries: [], period: 'today' });
  // Jobs Management tab
  const [jobsList, setJobsList] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsFilter, setJobsFilter] = useState({ status: 'all', category: '', search: '' });
  const [editJobDialogOpen, setEditJobDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '', company: '', location: '', salary: '', experience: '', type: '',
    description: '', requirements: '', category: '', industry: '', openings: '', status: 'active'
  });
  const [jobFormErrors, setJobFormErrors] = useState({});
  const [savingJob, setSavingJob] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 300000); // 5 min refresh
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const [summary, pipeline, financial, predictive, realtime] = await Promise.all([
        api.get(`/analytics/executive-summary?range=${dateRange}`),
        api.get(`/analytics/pipeline?range=${dateRange}`),
        api.get(`/analytics/financial?range=${dateRange}`),
        api.get('/analytics/predictive'),
        api.get('/analytics/realtime'),
      ]);

      setAnalytics({
        summary: summary.data.data,
        pipeline: pipeline.data.data,
        financial: financial.data.data,
        predictive: predictive.data.data,
        realtime: realtime.data.data,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWhatsAppLog = async () => {
    setWhatsappLogLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (whatsappLogFilter.status) params.set('status', whatsappLogFilter.status);
      if (whatsappLogFilter.type) params.set('type', whatsappLogFilter.type);
      const res = await api.get(`/analytics/whatsapp-log?${params}`);
      setWhatsappLog(res.data.data || { items: [], total: 0 });
    } catch (err) {
      console.error('Failed to fetch WhatsApp log:', err);
      setWhatsappLog({ items: [], total: 0 });
    } finally {
      setWhatsappLogLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 2) fetchWhatsAppLog();
  }, [activeTab, whatsappLogFilter]);

  const fetchEmailLog = async () => {
    setEmailLogLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (emailLogFilter.status) params.set('status', emailLogFilter.status);
      if (emailLogFilter.type) params.set('type', emailLogFilter.type);
      const res = await api.get(`/analytics/email-log?${params}`);
      setEmailLog(res.data.data || { items: [], total: 0 });
    } catch (err) {
      console.error('Failed to fetch email log:', err);
      setEmailLog({ items: [], total: 0 });
    } finally {
      setEmailLogLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 5) fetchEmailLog();
  }, [activeTab, emailLogFilter]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = usersRoleFilter ? { role: usersRoleFilter } : {};
      const res = await api.get('/auth/users', { params });
      setUsersList(res.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsersList([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 3) fetchUsers();
  }, [activeTab, usersRoleFilter]);

  const fetchThirdPartySettings = async () => {
    setTpLoading(true);
    setTpError('');
    try {
      const res = await api.get('/admin/settings');
      const data = res.data?.data ?? { email: {}, whatsapp: {}, sms: {}, openai: {}, website: {} };
      setTpSettings(data);
      setTpEdit(data);
    } catch (err) {
      console.error('Failed to fetch third-party settings:', err);
      setTpError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setTpLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 8) fetchThirdPartySettings();
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 6) fetchWebsiteErrors();
  }, [activeTab]);

  const fetchWebsiteErrors = async () => {
    setWebsiteErrorsLoading(true);
    try {
      const res = await api.get('/admin/website-errors', { params: { lines: 500 } });
      setWebsiteErrorsData(res.data?.data ?? { entries: [], period: 'today' });
    } catch (err) {
      console.error('Failed to fetch website errors:', err);
      setWebsiteErrorsData({ entries: [], period: 'today' });
    } finally {
      setWebsiteErrorsLoading(false);
    }
  };

  const fetchWaitingSessions = async () => {
    setWaitingSessionsLoading(true);
    try {
      const res = await api.get('/chatbot/agent/waiting-sessions');
      setWaitingSessions(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch waiting sessions:', err);
      setWaitingSessions([]);
    } finally {
      setWaitingSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 7) fetchWaitingSessions();
  }, [activeTab]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      // For admin, fetch all jobs regardless of Excel filter - we need to get all jobs
      // First try to get all jobs without status filter if status is 'all'
      let jobs = [];
      
      if (jobsFilter.status === 'all') {
        // Fetch jobs with different statuses and combine
        const [activeRes, inactiveRes, closedRes] = await Promise.all([
          api.get('/jobs/all?status=active'),
          api.get('/jobs/all?status=inactive').catch(() => ({ data: { data: { jobs: [] } } })),
          api.get('/jobs/all?status=closed').catch(() => ({ data: { data: { jobs: [] } } }))
        ]);
        jobs = [
          ...(activeRes.data?.data?.jobs || []),
          ...(inactiveRes.data?.data?.jobs || []),
          ...(closedRes.data?.data?.jobs || [])
        ];
      } else {
        const params = new URLSearchParams();
        params.set('status', jobsFilter.status || 'active');
        if (jobsFilter.category) {
          params.set('category', jobsFilter.category);
        }
        if (jobsFilter.search) {
          params.set('search', jobsFilter.search);
        }
        const res = await api.get(`/jobs/all?${params.toString()}`);
        jobs = res.data?.data?.jobs || [];
      }
      
      // Apply client-side filters for search and category if status is 'all'
      if (jobsFilter.status === 'all') {
        if (jobsFilter.search) {
          const searchLower = jobsFilter.search.toLowerCase();
          jobs = jobs.filter(job => 
            job.title?.toLowerCase().includes(searchLower) ||
            job.company?.toLowerCase().includes(searchLower) ||
            job.description?.toLowerCase().includes(searchLower)
          );
        }
        if (jobsFilter.category) {
          jobs = jobs.filter(job => 
            job.category === jobsFilter.category || job.industry === jobsFilter.category
          );
        }
      }
      
      setJobsList(jobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setJobsList([]);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 4) fetchJobs();
  }, [activeTab, jobsFilter]);

  const fetchSessionMessages = async (sid) => {
    if (!sid) return;
    setSessionMessagesLoading(true);
    try {
      const res = await api.get(`/chatbot/agent/session/${sid}`);
      setSessionMessages(res.data?.data?.messages || []);
      setSessionHandoff(res.data?.data?.handoff || null);
    } catch (err) {
      console.error('Failed to fetch session messages:', err);
      setSessionMessages([]);
      setSessionHandoff(null);
    } finally {
      setSessionMessagesLoading(false);
    }
  };

  const handleAgentJoin = async (sessionId) => {
    try {
      await api.post(`/chatbot/agent/join/${sessionId}`);
      setJoinedSessionId(sessionId);
      setSessionHandoff(null);
      fetchSessionMessages(sessionId);
      fetchWaitingSessions();
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  const handleAgentCloseSession = async () => {
    if (!joinedSessionId) return;
    try {
      await api.post(`/chatbot/agent/session/${joinedSessionId}/close`);
      await fetchSessionMessages(joinedSessionId);
    } catch (err) {
      console.error('Close session failed:', err);
    }
  };

  const handleSendAgentMessage = async () => {
    const content = agentMessageInput.trim();
    if (!content || !joinedSessionId) return;
    setSendingAgentMessage(true);
    try {
      await api.post(`/chatbot/agent/session/${joinedSessionId}/message`, { content });
      setAgentMessageInput('');
      setSessionMessages((prev) => [...prev, { id: Date.now(), role: 'agent', content, createdAt: new Date().toISOString() }]);
    } catch (err) {
      console.error('Send agent message failed:', err);
    } finally {
      setSendingAgentMessage(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 6 || !joinedSessionId) return;
    liveChatPollRef.current = setInterval(() => fetchSessionMessages(joinedSessionId), 3000);
    return () => {
      if (liveChatPollRef.current) clearInterval(liveChatPollRef.current);
    };
  }, [activeTab, joinedSessionId]);

  const updateTpEdit = (section, key, value) => {
    setTpEdit((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  };

  const handleSaveThirdPartySettings = async () => {
    setTpSaving(true);
    setTpError('');
    try {
      const res = await api.put('/admin/settings', {
        email: tpEdit.email,
        whatsapp: tpEdit.whatsapp,
        sms: tpEdit.sms,
        openai: tpEdit.openai,
        website: tpEdit.website,
      });
      setTpSettings(res.data?.data ?? tpEdit);
      setTpEdit(res.data?.data ?? tpEdit);
    } catch (err) {
      setTpError(err.response?.data?.message || 'Failed to save');
    } finally {
      setTpSaving(false);
    }
  };

  const openAddUser = () => {
    setUserForm({ email: '', password: '', name: '', fullName: '', role: 'worker', companyName: '', phone: '', address: '', isDemoAccount: false, demoPassword: '' });
    setUserFormError('');
    setUserDialogMode('add');
    setEditingUserId(null);
  };

  const openEditUser = (user) => {
    setUserForm({
      email: user.email || '',
      password: '',
      name: user.name || '',
      fullName: user.fullName || '',
      role: user.role || 'worker',
      companyName: user.companyName || '',
      phone: user.phone || '',
      address: user.address || '',
      isDemoAccount: !!user.is_demo_account,
      demoPassword: user.demo_password || '',
    });
    setUserFormError('');
    setUserDialogMode('edit');
    setEditingUserId(user.id);
  };

  const closeUserDialog = () => {
    setUserDialogMode(null);
    setEditingUserId(null);
    setUserFormError('');
  };

  const handleSaveUser = async () => {
    setUserFormError('');
    if (userDialogMode === 'add') {
      if (!userForm.email?.trim() || !userForm.password || !userForm.name?.trim() || !userForm.role) {
        setUserFormError('Email, password, name, and role are required.');
        return;
      }
      setSavingUser(true);
      try {
        await api.post('/auth/users', {
          email: userForm.email.trim(),
          password: userForm.password,
          name: userForm.name.trim(),
          fullName: userForm.fullName?.trim() || userForm.name.trim(),
          role: userForm.role,
          companyName: userForm.companyName?.trim() || null,
          phone: userForm.phone?.trim() || null,
          address: userForm.address?.trim() || null,
          is_demo_account: userForm.isDemoAccount,
          demo_password: userForm.isDemoAccount ? (userForm.demoPassword?.trim() || null) : null,
        });
        closeUserDialog();
        fetchUsers();
      } catch (err) {
        setUserFormError(err.response?.data?.message || 'Failed to create user');
      } finally {
        setSavingUser(false);
      }
    } else {
      if (!userForm.email?.trim() || !userForm.name?.trim() || !userForm.role) {
        setUserFormError('Email, name, and role are required.');
        return;
      }
      setSavingUser(true);
      try {
        const payload = {
          email: userForm.email.trim(),
          name: userForm.name.trim(),
          fullName: userForm.fullName?.trim() || userForm.name.trim(),
          role: userForm.role,
          companyName: userForm.companyName?.trim() || null,
          phone: userForm.phone?.trim() || null,
          address: userForm.address?.trim() || null,
          is_demo_account: userForm.isDemoAccount,
        };
        if (!userForm.isDemoAccount) payload.demo_password = null;
        else if (userForm.demoPassword?.trim() !== '') payload.demo_password = userForm.demoPassword.trim();
        if (userForm.password) payload.password = userForm.password;
        await api.put(`/auth/users/${editingUserId}`, payload);
        closeUserDialog();
        fetchUsers();
      } catch (err) {
        setUserFormError(err.response?.data?.message || 'Failed to update user');
      } finally {
        setSavingUser(false);
      }
    }
  };

  const MetricCard = ({ title, value, change, icon, color = 'primary' }) => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {change && (
              <Box display="flex" alignItems="center" mt={1}>
                {change > 0 ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
                <Typography
                  variant="body2"
                  color={change > 0 ? 'success.main' : 'error.main'}
                  ml={1}
                >
                  {Math.abs(change)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const PipelineStageCard = ({ stage }) => (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">{stage.stage}</Typography>
            <Typography variant="h3" color="primary">
              {stage.count}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Avg: {stage.avg_days} days
            </Typography>
          </Box>
          <Box textAlign="right">
            <CircularProgress
              variant="determinate"
              value={stage.conversion_rate}
              size={60}
            />
            <Typography variant="caption" display="block" mt={1}>
              {stage.conversion_rate}% conversion
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={100 - stage.drop_off_rate}
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  );

  const shellProps = {
    navGroups: adminNavGroups,
    activeId: activeTab,
    onNavSelect: setActiveTab,
    topbarTitle: adminTabTitle(activeTab),
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

  if (!analytics) {
    return (
      <DashboardShell {...shellProps}>
        <Alert severity="error">Failed to load dashboard data. Please refresh.</Alert>
      </DashboardShell>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <DashboardShell {...shellProps}>
      {/* Analytics Tab */}
      {activeTab === 0 && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
          >
            {dateRange}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => {
              setRefreshing(true);
              fetchAnalytics();
            }}
            disabled={refreshing}
          >
            {refreshing ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Executive Summary Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Workers"
            value={analytics?.summary?.totalWorkers ?? 0}
            change={analytics?.summary?.workersGrowth}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Active Jobs"
            value={analytics?.summary?.activeJobs ?? 0}
            change={analytics?.summary?.jobsGrowth}
            icon={<Work />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Successful Placements"
            value={analytics?.summary?.successfulPlacements ?? 0}
            change={analytics?.summary?.placementsGrowth}
            icon={<CheckCircle />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Revenue"
            value={`₹${(analytics?.summary?.revenue ?? 0).toLocaleString()}`}
            change={analytics?.summary?.revenueGrowth}
            icon={<AttachMoney />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Real-time Status Bar */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                <Visibility color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{analytics?.realtime?.activeUsers ?? 0}</Typography>
                  <Typography variant="caption">Active Users</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                <Schedule color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{analytics?.realtime?.interviewsScheduled ?? 0}</Typography>
                  <Typography variant="caption">Interviews Today</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                <Assessment color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{analytics?.realtime?.documentsVerified ?? 0}</Typography>
                  <Typography variant="caption">Docs Verified</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                <Speed color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{analytics?.realtime?.systemHealth ?? 100}%</Typography>
                  <Typography variant="caption">System Health</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pipeline Analytics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Pipeline Analytics
          </Typography>
        </Grid>
        {(analytics?.pipeline ?? []).map((stage, index) => (
          <Grid item xs={12} md={6} lg={3} key={index}>
            <PipelineStageCard stage={stage} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.financial?.revenueByCategory ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Revenue (₹)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skill Demand
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.summary?.topSkills ?? []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {(analytics?.summary?.topSkills ?? []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Predictive Insights */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Predictive Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Alert severity="info">
                <Typography variant="subtitle2">Success Rate Prediction</Typography>
                <Typography variant="h4">{analytics?.predictive?.successPredictions?.accuracy ?? 0}%</Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="warning">
                <Typography variant="subtitle2">Risk Alerts</Typography>
                <Typography variant="h4">{(analytics?.predictive?.riskAnalysis ?? []).length}</Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="success">
                <Typography variant="subtitle2">Market Confidence</Typography>
                <Typography variant="h4">{analytics?.predictive?.confidence ?? 0}%</Typography>
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
        </>
      )}

      {/* Safety & Welfare Tab */}
      {activeTab === 1 && (
        <AdminSafetyDashboard />
      )}

      {/* WhatsApp Log Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
              <Typography variant="h6">Interakt WhatsApp Messages</Typography>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label="All"
                  onClick={() => setWhatsappLogFilter((f) => ({ ...f, status: '' }))}
                  color={whatsappLogFilter.status === '' ? 'primary' : 'default'}
                  variant={whatsappLogFilter.status === '' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Sent"
                  onClick={() => setWhatsappLogFilter((f) => ({ ...f, status: 'sent' }))}
                  color={whatsappLogFilter.status === 'sent' ? 'success' : 'default'}
                  variant={whatsappLogFilter.status === 'sent' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Failed"
                  onClick={() => setWhatsappLogFilter((f) => ({ ...f, status: 'fail' }))}
                  color={whatsappLogFilter.status === 'fail' ? 'error' : 'default'}
                  variant={whatsappLogFilter.status === 'fail' ? 'filled' : 'outlined'}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={whatsappLogFilter.type || ''}
                    label="Type"
                    onChange={(e) => setWhatsappLogFilter((f) => ({ ...f, type: e.target.value || '' }))}
                  >
                    <MenuItem value="">All types</MenuItem>
                    <MenuItem value="application_confirmation">Application confirmation</MenuItem>
                    <MenuItem value="application_rejection">Application rejection</MenuItem>
                    <MenuItem value="emergency">Emergency</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  startIcon={whatsappLogLoading ? <CircularProgress size={16} /> : <Refresh />}
                  onClick={fetchWhatsAppLog}
                  disabled={whatsappLogLoading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>To</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Message ID</strong></TableCell>
                  <TableCell><strong>Error detail</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {whatsappLogLoading && whatsappLog.items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">Loading…</TableCell></TableRow>
                ) : whatsappLog.items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No WhatsApp messages logged yet.</TableCell></TableRow>
                ) : (
                  whatsappLog.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.phoneMasked}</TableCell>
                      <TableCell>
                        {row.success ? (
                          <Chip label="Sent" color="success" size="small" />
                        ) : (
                          <Chip label="Failed" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.messageId || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }} title={row.errorDetail || ''}>
                        {row.errorDetail ? (
                          <Typography variant="body2" color="error" noWrap sx={{ maxWidth: 280 }}>
                            {row.errorDetail}
                          </Typography>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {whatsappLog.total > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing {whatsappLog.items.length} of {whatsappLog.total}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Log Tab */}
      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
              <Typography variant="h6">Email send log</Typography>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label="All"
                  onClick={() => setEmailLogFilter((f) => ({ ...f, status: '' }))}
                  color={emailLogFilter.status === '' ? 'primary' : 'default'}
                  variant={emailLogFilter.status === '' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Sent"
                  onClick={() => setEmailLogFilter((f) => ({ ...f, status: 'sent' }))}
                  color={emailLogFilter.status === 'sent' ? 'success' : 'default'}
                  variant={emailLogFilter.status === 'sent' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Failed"
                  onClick={() => setEmailLogFilter((f) => ({ ...f, status: 'fail' }))}
                  color={emailLogFilter.status === 'fail' ? 'error' : 'default'}
                  variant={emailLogFilter.status === 'fail' ? 'filled' : 'outlined'}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={emailLogFilter.type || ''}
                    label="Type"
                    onChange={(e) => setEmailLogFilter((f) => ({ ...f, type: e.target.value || '' }))}
                  >
                    <MenuItem value="">All types</MenuItem>
                    <MenuItem value="application_confirmation">Application confirmation</MenuItem>
                    <MenuItem value="application_rejection">Application rejection</MenuItem>
                    <MenuItem value="appeal_confirmation">Appeal confirmation</MenuItem>
                    <MenuItem value="test">Test</MenuItem>
                    <MenuItem value="speak_to_human">Speak to human</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  startIcon={emailLogLoading ? <CircularProgress size={16} /> : <Refresh />}
                  onClick={fetchEmailLog}
                  disabled={emailLogLoading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>To</strong></TableCell>
                  <TableCell><strong>From</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Message ID</strong></TableCell>
                  <TableCell><strong>Error</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emailLogLoading && emailLog.items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">Loading…</TableCell></TableRow>
                ) : emailLog.items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">No emails logged yet.</TableCell></TableRow>
                ) : (
                  emailLog.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.toAddress}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.fromAddress}</TableCell>
                      <TableCell>
                        {row.success ? (
                          <Chip label="Sent" color="success" size="small" />
                        ) : (
                          <Chip label="Failed" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.messageId || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }} title={row.errorDetail || ''}>
                        {row.errorDetail ? (
                          <Typography variant="body2" color="error" noWrap sx={{ maxWidth: 280 }}>
                            {row.errorDetail}
                          </Typography>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {emailLog.total > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing {emailLog.items.length} of {emailLog.total}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Jobs Tab */}
      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
              <Typography variant="h6">Jobs Management</Typography>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder="Search jobs..."
                  value={jobsFilter.search}
                  onChange={(e) => setJobsFilter({ ...jobsFilter, search: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={jobsFilter.status}
                    label="Status"
                    onChange={(e) => setJobsFilter({ ...jobsFilter, status: e.target.value })}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  startIcon={jobsLoading ? <CircularProgress size={16} /> : <Refresh />}
                  onClick={fetchJobs}
                  disabled={jobsLoading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
            {jobsLoading && jobsList.length === 0 ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : jobsList.length === 0 ? (
              <Alert severity="info">No jobs found.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Company</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Salary</strong></TableCell>
                    <TableCell><strong>Openings</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobsList.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>{job.id}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={job.title}>
                          {job.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>
                        <Chip label={job.category || job.industry || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>{job.salary}</TableCell>
                      <TableCell>{job.openings || 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={job.status || 'active'}
                          size="small"
                          color={job.status === 'active' ? 'success' : job.status === 'closed' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedJob(job);
                            setJobForm({
                              title: job.title || '',
                              company: job.company || '',
                              location: job.location || '',
                              salary: job.salary || '',
                              experience: job.experience || '',
                              type: job.type || 'Full-time',
                              description: job.description || '',
                              requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : (job.requirements || ''),
                              category: job.category || '',
                              industry: job.industry || job.category || '',
                              openings: job.openings?.toString() || '1',
                              status: job.status || 'active'
                            });
                            setJobFormErrors({});
                            setEditJobDialogOpen(true);
                          }}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {jobsList.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Showing {jobsList.length} job{jobsList.length !== 1 ? 's' : ''}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Users Tab */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
              <Typography variant="h6">User Management</Typography>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label="All"
                  onClick={() => setUsersRoleFilter('')}
                  color={usersRoleFilter === '' ? 'primary' : 'default'}
                  variant={usersRoleFilter === '' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Admin"
                  onClick={() => setUsersRoleFilter('admin')}
                  color={usersRoleFilter === 'admin' ? 'primary' : 'default'}
                  variant={usersRoleFilter === 'admin' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Employer"
                  onClick={() => setUsersRoleFilter('employer')}
                  color={usersRoleFilter === 'employer' ? 'primary' : 'default'}
                  variant={usersRoleFilter === 'employer' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Worker"
                  onClick={() => setUsersRoleFilter('worker')}
                  color={usersRoleFilter === 'worker' ? 'primary' : 'default'}
                  variant={usersRoleFilter === 'worker' ? 'filled' : 'outlined'}
                />
                <Button variant="contained" startIcon={<PersonAdd />} onClick={openAddUser}>
                  Add User
                </Button>
                <Button
                  size="small"
                  startIcon={usersLoading ? <CircularProgress size={16} /> : <Refresh />}
                  onClick={fetchUsers}
                  disabled={usersLoading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Company</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersLoading && usersList.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">Loading…</TableCell></TableRow>
                ) : usersList.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">No users found.</TableCell></TableRow>
                ) : (
                  usersList.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.fullName || row.name || '—'}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                          <Chip label={row.role} size="small" color={row.role === 'admin' ? 'error' : row.role === 'employer' ? 'primary' : 'default'} />
                          {row.is_demo_account && <Chip label="Demo" size="small" variant="outlined" color="secondary" />}
                        </Box>
                      </TableCell>
                      <TableCell>{row.companyName || '—'}</TableCell>
                      <TableCell>{row.phone || '—'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<EditIcon />} onClick={() => openEditUser(row)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Website errors tab */}
      {activeTab === 5 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Website errors</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {websiteErrorsData.period === 'no entries' ? 'No errors logged yet. Chatbot and rate-limit errors appear here.' : `Showing ${websiteErrorsData.period} from the log.`}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <Button size="small" startIcon={websiteErrorsLoading ? <CircularProgress size={16} /> : <Refresh />} onClick={fetchWebsiteErrors} disabled={websiteErrorsLoading}>
                Refresh
              </Button>
            </Box>
            {websiteErrorsLoading && websiteErrorsData.entries.length === 0 ? (
              <Typography color="text.secondary">Loading…</Typography>
            ) : websiteErrorsData.entries.length === 0 ? (
              <Typography color="text.secondary">No website errors in the log yet. Errors from the chatbot and rate limits will appear here after they occur.</Typography>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 480, overflow: 'auto', bgcolor: '#fafafa' }}>
                <Box component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0 }}>
                  {websiteErrorsData.entries.map((e, i) => (
                    <Box key={i} sx={{ mb: 0.5 }}>
                      {e.ts && <Typography component="span" variant="caption" color="text.secondary">[{e.ts}] </Typography>}
                      {e.source && <Typography component="span" variant="caption" color="primary">[{e.source}] </Typography>}
                      <Typography component="span" variant="caption">{e.message}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live chat tab: waiting sessions + join + chat with user */}
      {activeTab === 6 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Chat join requests</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              When a user clicks &quot;Connect me with Apravas support&quot;, they appear here. Click Join to see the conversation and chat with them.
            </Typography>
            {joinedSessionId ? (
              <Box>
                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                  <Button size="small" onClick={() => { setJoinedSessionId(null); setSessionMessages([]); setSessionHandoff(null); }}>
                    ← Back to list
                  </Button>
                  {sessionHandoff?.status !== 'closed' && (
                    <Button size="small" variant="outlined" color="secondary" onClick={handleAgentCloseSession}>
                      End session
                    </Button>
                  )}
                </Box>
                {sessionHandoff?.status === 'closed' && (
                  <Alert severity="info" sx={{ mb: 2 }}>Session ended. The other party has been notified.</Alert>
                )}
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, minHeight: 280, maxHeight: 400, overflowY: 'auto', bgcolor: '#fafafa' }}>
                  {sessionMessagesLoading && sessionMessages.length === 0 ? (
                    <Typography color="text.secondary">Loading…</Typography>
                  ) : (
                    sessionMessages.map((msg) => (
                      <Box key={msg.id} sx={{ mb: 1.5, display: 'flex', justifyContent: msg.role === 'system' ? 'center' : msg.role === 'user' ? 'flex-start' : 'flex-end' }}>
                        <Paper elevation={0} sx={{ p: 1.5, maxWidth: '85%', bgcolor: msg.role === 'agent' ? 'primary.light' : msg.role === 'user' ? '#e3f2fd' : msg.role === 'system' ? 'rgba(0,0,0,0.06)' : '#f5f5f5', color: msg.role === 'agent' ? 'primary.contrastText' : 'text.primary' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            {msg.role === 'user' ? 'User' : msg.role === 'agent' ? 'You (Agent)' : msg.role === 'system' ? 'System' : 'Bot'}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', ...(msg.role === 'system' && { fontStyle: 'italic', color: 'text.secondary' }) }}>{msg.content}</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(msg.createdAt).toLocaleTimeString()}</Typography>
                        </Paper>
                      </Box>
                    ))
                  )}
                </Box>
                <Box display="flex" gap={1} sx={{ mt: 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={sessionHandoff?.status === 'closed' ? 'Session ended' : 'Type a message to the user…'}
                    value={agentMessageInput}
                    onChange={(e) => setAgentMessageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAgentMessage(); } }}
                    disabled={sessionHandoff?.status === 'closed'}
                  />
                  <Button variant="contained" onClick={handleSendAgentMessage} disabled={sendingAgentMessage || !agentMessageInput.trim() || sessionHandoff?.status === 'closed'}>
                    Send
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Button size="small" startIcon={waitingSessionsLoading ? <CircularProgress size={16} /> : <Refresh />} onClick={fetchWaitingSessions} disabled={waitingSessionsLoading} sx={{ mb: 2 }}>
                  Refresh
                </Button>
                {waitingSessions.length === 0 ? (
                  <Typography color="text.secondary">No chat join requests right now.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Mobile</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Session ID</strong></TableCell>
                        <TableCell><strong>Created</strong></TableCell>
                        <TableCell align="right"><strong>Action</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {waitingSessions.map((row) => (
                        <TableRow key={row.sessionId}>
                          <TableCell>{row.userName || '—'}</TableCell>
                          <TableCell>{row.userMobile || '—'}</TableCell>
                          <TableCell>{row.userEmail || '—'}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.sessionId}</TableCell>
                          <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="contained" onClick={() => handleAgentJoin(row.sessionId)}>Join</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 7 && (
        <Box display="flex" flexDirection="column" gap={3}>
          {tpError && <Alert severity="error" onClose={() => setTpError('')}>{tpError}</Alert>}
          {tpLoading ? (
            <Box display="flex" alignItems="center" gap={2}><CircularProgress size={24} /> Loading settings…</Box>
          ) : (
            <>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">Email</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <Box display="flex" alignItems="center" gap={1}>
                          <input
                            type="checkbox"
                            id="email_service_enabled"
                            checked={tpEdit.email?.email_service_enabled === 'true'}
                            onChange={(e) => updateTpEdit('email', 'email_service_enabled', e.target.checked ? 'true' : '')}
                          />
                          <Typography component="label" htmlFor="email_service_enabled">Email service enabled</Typography>
                        </Box>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Default From Email"
                        value={tpEdit.email?.default_from_email ?? ''}
                        onChange={(e) => updateTpEdit('email', 'default_from_email', e.target.value)}
                        placeholder='e.g. "Apravas" &lt;noreply@example.com&gt;'
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Recruitment contact email"
                        value={tpEdit.email?.recruitment_email ?? ''}
                        onChange={(e) => updateTpEdit('email', 'recruitment_email', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Recruitment phone"
                        value={tpEdit.email?.recruitment_phone ?? ''}
                        onChange={(e) => updateTpEdit('email', 'recruitment_phone', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Recruitment WhatsApp"
                        value={tpEdit.email?.recruitment_whatsapp ?? ''}
                        onChange={(e) => updateTpEdit('email', 'recruitment_whatsapp', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>SMTP (overrides .env when set)</Typography></Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="SMTP host"
                        value={tpEdit.email?.smtp_host ?? ''}
                        onChange={(e) => updateTpEdit('email', 'smtp_host', e.target.value)}
                        placeholder="e.g. email-smtp.ap-south-1.amazonaws.com"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="SMTP port"
                        value={tpEdit.email?.smtp_port ?? ''}
                        onChange={(e) => updateTpEdit('email', 'smtp_port', e.target.value)}
                        placeholder="587"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <Box display="flex" alignItems="center" gap={1} sx={{ pt: 1 }}>
                          <input
                            type="checkbox"
                            id="smtp_secure"
                            checked={tpEdit.email?.smtp_secure === 'true'}
                            onChange={(e) => updateTpEdit('email', 'smtp_secure', e.target.checked ? 'true' : '')}
                          />
                          <Typography component="label" htmlFor="smtp_secure">Use TLS/SSL (secure)</Typography>
                        </Box>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="SMTP user"
                        type={showSecret.smtp_user ? 'text' : 'password'}
                        value={tpEdit.email?.smtp_user ?? ''}
                        onChange={(e) => updateTpEdit('email', 'smtp_user', e.target.value)}
                        placeholder="Leave blank to keep current"
                        fullWidth
                        size="small"
                        helperText="Shown masked when set. Enter new value to replace."
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => toggleShowSecret('smtp_user')} edge="end" size="small" aria-label={showSecret.smtp_user ? 'Hide' : 'View'}>
                                {showSecret.smtp_user ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="SMTP password"
                        type={showSecret.smtp_pass ? 'text' : 'password'}
                        value={tpEdit.email?.smtp_pass ?? ''}
                        onChange={(e) => updateTpEdit('email', 'smtp_pass', e.target.value)}
                        placeholder="Leave blank to keep current"
                        fullWidth
                        size="small"
                        helperText="Shown masked when set. Enter new value to replace."
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => toggleShowSecret('smtp_pass')} edge="end" size="small" aria-label={showSecret.smtp_pass ? 'Hide' : 'View'}>
                                {showSecret.smtp_pass ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">WhatsApp (Interakt)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <Box display="flex" alignItems="center" gap={1}>
                          <input
                            type="checkbox"
                            id="whatsapp_enabled"
                            checked={tpEdit.whatsapp?.whatsapp_enabled === 'true'}
                            onChange={(e) => updateTpEdit('whatsapp', 'whatsapp_enabled', e.target.checked ? 'true' : '')}
                          />
                          <Typography component="label" htmlFor="whatsapp_enabled">WhatsApp enabled</Typography>
                        </Box>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Interakt API key (Base64)"
                        type={showSecret.interakt_api_key ? 'text' : 'password'}
                        value={tpEdit.whatsapp?.interakt_api_key ?? ''}
                        onChange={(e) => updateTpEdit('whatsapp', 'interakt_api_key', e.target.value)}
                        placeholder="Leave blank to keep current"
                        fullWidth
                        size="small"
                        helperText="Shown masked when set. Enter new value to replace."
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => toggleShowSecret('interakt_api_key')} edge="end" size="small" aria-label={showSecret.interakt_api_key ? 'Hide' : 'View'}>
                                {showSecret.interakt_api_key ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Emergency template name"
                        value={tpEdit.whatsapp?.emergency_template_name ?? ''}
                        onChange={(e) => updateTpEdit('whatsapp', 'emergency_template_name', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Application confirmation template"
                        value={tpEdit.whatsapp?.application_confirmation_template ?? ''}
                        onChange={(e) => updateTpEdit('whatsapp', 'application_confirmation_template', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Application rejection template"
                        value={tpEdit.whatsapp?.application_rejection_template ?? ''}
                        onChange={(e) => updateTpEdit('whatsapp', 'application_rejection_template', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">SMS (Twilio)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <Box display="flex" alignItems="center" gap={1}>
                          <input
                            type="checkbox"
                            id="sms_enabled"
                            checked={tpEdit.sms?.sms_enabled === 'true'}
                            onChange={(e) => updateTpEdit('sms', 'sms_enabled', e.target.checked ? 'true' : '')}
                          />
                          <Typography component="label" htmlFor="sms_enabled">SMS enabled</Typography>
                        </Box>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Twilio Account SID"
                        value={tpEdit.sms?.twilio_account_sid ?? ''}
                        onChange={(e) => updateTpEdit('sms', 'twilio_account_sid', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Twilio Auth Token"
                        type={showSecret.twilio_auth_token ? 'text' : 'password'}
                        value={tpEdit.sms?.twilio_auth_token ?? ''}
                        onChange={(e) => updateTpEdit('sms', 'twilio_auth_token', e.target.value)}
                        placeholder="Leave blank to keep current"
                        fullWidth
                        size="small"
                        helperText="Shown masked when set. Enter new value to replace."
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => toggleShowSecret('twilio_auth_token')} edge="end" size="small" aria-label={showSecret.twilio_auth_token ? 'Hide' : 'View'}>
                                {showSecret.twilio_auth_token ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Twilio phone number"
                        value={tpEdit.sms?.twilio_phone_number ?? ''}
                        onChange={(e) => updateTpEdit('sms', 'twilio_phone_number', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">OpenAI (Chatbot)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="OpenAI API key"
                        type={showSecret.openai_api_key ? 'text' : 'password'}
                        value={tpEdit.openai?.openai_api_key ?? ''}
                        onChange={(e) => updateTpEdit('openai', 'openai_api_key', e.target.value)}
                        placeholder="Leave blank to keep current"
                        fullWidth
                        size="small"
                        helperText="Shown masked when set. Enter new value to replace."
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => toggleShowSecret('openai_api_key')} edge="end" size="small" aria-label={showSecret.openai_api_key ? 'Hide' : 'View'}>
                                {showSecret.openai_api_key ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="OpenAI model"
                        value={tpEdit.openai?.openai_model ?? ''}
                        onChange={(e) => updateTpEdit('openai', 'openai_model', e.target.value)}
                        placeholder="gpt-4o-mini"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">Website (CORS &amp; Chatbot)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="CORS origins (comma-separated)"
                        value={tpEdit.website?.cors_origins ?? ''}
                        onChange={(e) => updateTpEdit('website', 'cors_origins', e.target.value)}
                        placeholder="https://app.apravas.com,https://www.apravas.com"
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Chatbot rate limit (max requests)"
                        value={tpEdit.website?.chatbot_rate_limit_max ?? ''}
                        onChange={(e) => updateTpEdit('website', 'chatbot_rate_limit_max', e.target.value)}
                        placeholder="100"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Chatbot rate limit window (ms)"
                        value={tpEdit.website?.chatbot_rate_limit_window ?? ''}
                        onChange={(e) => updateTpEdit('website', 'chatbot_rate_limit_window', e.target.value)}
                        placeholder="3600000"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Chatbot session timeout (ms)"
                        value={tpEdit.website?.chatbot_session_timeout ?? ''}
                        onChange={(e) => updateTpEdit('website', 'chatbot_session_timeout', e.target.value)}
                        placeholder="7776000000"
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Button variant="contained" onClick={handleSaveThirdPartySettings} disabled={tpSaving}>
                {tpSaving ? <CircularProgress size={24} /> : 'Save all settings'}
              </Button>
            </>
          )}
        </Box>
      )}

      {/* Edit Job Dialog */}
      <Dialog open={editJobDialogOpen} onClose={() => { setEditJobDialogOpen(false); setSelectedJob(null); setJobFormErrors({}); }} maxWidth="md" fullWidth>
        <DialogTitle>Edit Job</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Job Title *"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  fullWidth
                  required
                  error={!!jobFormErrors.title}
                  helperText={jobFormErrors.title}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company *"
                  value={jobForm.company}
                  onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                  fullWidth
                  required
                  error={!!jobFormErrors.company}
                  helperText={jobFormErrors.company}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location *"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  fullWidth
                  required
                  error={!!jobFormErrors.location}
                  helperText={jobFormErrors.location}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Salary *"
                  value={jobForm.salary}
                  onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                  fullWidth
                  required
                  error={!!jobFormErrors.salary}
                  helperText={jobFormErrors.salary}
                  placeholder="e.g., ₹70,000 - ₹100,000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Experience"
                  value={jobForm.experience}
                  onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                  fullWidth
                  placeholder="e.g., 2-5 years"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={jobForm.type}
                    label="Job Type"
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                  >
                    <MenuItem value="Full-time">Full-time</MenuItem>
                    <MenuItem value="Part-time">Part-time</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                    <MenuItem value="Temporary">Temporary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!jobFormErrors.category}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={jobForm.category}
                    label="Category *"
                    onChange={(e) => setJobForm({ ...jobForm, category: e.target.value, industry: e.target.value })}
                  >
                    <MenuItem value="Construction">Construction</MenuItem>
                    <MenuItem value="Healthcare">Healthcare</MenuItem>
                    <MenuItem value="Agriculture">Agriculture</MenuItem>
                    <MenuItem value="Hospitality">Hospitality</MenuItem>
                    <MenuItem value="IT Support">IT Support</MenuItem>
                    <MenuItem value="Nursing">Nursing</MenuItem>
                    <MenuItem value="Driver">Driver</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                    <MenuItem value="Cleaning">Cleaning</MenuItem>
                    <MenuItem value="Cooking/Chef">Cooking/Chef</MenuItem>
                    <MenuItem value="Plumber">Plumber</MenuItem>
                    <MenuItem value="Electrician">Electrician</MenuItem>
                    <MenuItem value="Carpenter">Carpenter</MenuItem>
                    <MenuItem value="Welder">Welder</MenuItem>
                  </Select>
                  {jobFormErrors.category && <Typography variant="caption" color="error">{jobFormErrors.category}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Number of Openings"
                  type="number"
                  value={jobForm.openings}
                  onChange={(e) => setJobForm({ ...jobForm, openings: e.target.value })}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={jobForm.status}
                    label="Status"
                    onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Job Description *"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={4}
                  required
                  error={!!jobFormErrors.description}
                  helperText={jobFormErrors.description}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Requirements (comma-separated)"
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g., Minimum 2 years experience, Valid work permit, Physical fitness certificate"
                  helperText="Separate multiple requirements with commas"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditJobDialogOpen(false); setSelectedJob(null); setJobFormErrors({}); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              // Validate form
              const errors = {};
              if (!jobForm.title?.trim()) errors.title = 'Title is required';
              if (!jobForm.company?.trim()) errors.company = 'Company is required';
              if (!jobForm.location?.trim()) errors.location = 'Location is required';
              if (!jobForm.salary?.trim()) errors.salary = 'Salary is required';
              if (!jobForm.description?.trim()) errors.description = 'Description is required';
              if (!jobForm.category?.trim()) errors.category = 'Category is required';
              
              if (Object.keys(errors).length > 0) {
                setJobFormErrors(errors);
                return;
              }

              setSavingJob(true);
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
                  industry: jobForm.industry || jobForm.category,
                  openings: parseInt(jobForm.openings) || 1,
                  status: jobForm.status,
                });

                if (response.data.success) {
                  setEditJobDialogOpen(false);
                  setSelectedJob(null);
                  setJobFormErrors({});
                  fetchJobs(); // Refresh jobs list
                }
              } catch (error) {
                console.error('Error updating job:', error);
                setJobFormErrors({ submit: error.response?.data?.message || 'Failed to update job' });
              } finally {
                setSavingJob(false);
              }
            }}
            disabled={savingJob}
            startIcon={savingJob ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {savingJob ? 'Saving...' : 'Update Job'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit User Dialog */}
      <Dialog open={userDialogMode !== null} onClose={closeUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{userDialogMode === 'add' ? 'Add User' : 'Edit User'}</DialogTitle>
        <DialogContent>
          {userFormError && <Alert severity="error" sx={{ mb: 2 }}>{userFormError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={userDialogMode === 'edit' ? 'Leave blank to keep current' : ''}
              fullWidth
              required={userDialogMode === 'add'}
            />
            <TextField
              label="Name"
              value={userForm.name}
              onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Full name"
              value={userForm.fullName}
              onChange={(e) => setUserForm((f) => ({ ...f, fullName: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={userForm.role}
                label="Role"
                onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="employer">Employer</MenuItem>
                <MenuItem value="worker">Worker</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Company name"
              value={userForm.companyName}
              onChange={(e) => setUserForm((f) => ({ ...f, companyName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Phone"
              value={userForm.phone}
              onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Address"
              value={userForm.address}
              onChange={(e) => setUserForm((f) => ({ ...f, address: e.target.value }))}
              fullWidth
              multiline
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={userForm.isDemoAccount}
                  onChange={(e) => setUserForm((f) => ({ ...f, isDemoAccount: e.target.checked }))}
                />
              }
              label="Demo account (show on login page)"
            />
            {userForm.isDemoAccount && (
              <TextField
                label="Demo password (for Login as: populates form and logs in)"
                type="password"
                value={userForm.demoPassword}
                onChange={(e) => setUserForm((f) => ({ ...f, demoPassword: e.target.value }))}
                placeholder={userDialogMode === 'edit' ? 'Leave blank to keep current' : 'Same as account password or any'}
                fullWidth
                helperText="Filled in when user clicks Login as; then form submits to dashboard."
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUserDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveUser} disabled={savingUser}>
            {savingUser ? <CircularProgress size={24} /> : (userDialogMode === 'add' ? 'Create' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardShell>
  );
};

export default ApravasAdminDashboard;
