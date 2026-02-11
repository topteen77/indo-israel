import React, { useState, useEffect, useRef } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Chip,
  LinearProgress, CircularProgress, Button, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  Alert, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Checkbox, FormControlLabel, Paper,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, People, Work, AttachMoney,
  Speed, CheckCircle, Schedule, Assessment,
  Visibility, Download, FilterList, Refresh, SafetyCheck, Chat,
  PersonAdd, Edit as EditIcon, Settings as SettingsIcon, Email as EmailIcon,
} from '@mui/icons-material';
import AdminSafetyDashboard from '../Safety/AdminSafetyDashboard';
import { Tab, Tabs } from '@mui/material';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../utils/api';

const ApravasAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
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
  // Settings tab (admin: third-party Email, WhatsApp, SMS)
  const [tpSettings, setTpSettings] = useState({ email: {}, whatsapp: {}, sms: {} });
  const [tpEdit, setTpEdit] = useState({ email: {}, whatsapp: {}, sms: {} });
  const [tpLoading, setTpLoading] = useState(false);
  const [tpSaving, setTpSaving] = useState(false);
  const [tpError, setTpError] = useState('');
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
    if (activeTab === 4) fetchEmailLog();
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
      const data = res.data?.data ?? { general: {}, email: {}, whatsapp: {}, sms: {} };
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
    if (activeTab === 6) fetchThirdPartySettings();
  }, [activeTab]);

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
    if (activeTab === 5) fetchWaitingSessions();
  }, [activeTab]);

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
    if (activeTab !== 5 || !joinedSessionId) return;
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
        general: tpEdit.general,
        email: tpEdit.email,
        whatsapp: tpEdit.whatsapp,
        sms: tpEdit.sms,
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="error">Failed to load dashboard data. Please refresh.</Alert>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Apravas Admin Dashboard
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        indicatorColor="primary"
        textColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Analytics" icon={<Assessment />} />
        <Tab label="Safety & Welfare" icon={<SafetyCheck />} />
        <Tab label="WhatsApp Log" icon={<Chat />} />
        <Tab label="Users" icon={<People />} />
        <Tab label="Email Log" icon={<EmailIcon />} />
        <Tab label="Live chat" icon={<Chat />} />
        <Tab label="Settings" icon={<SettingsIcon />} />
      </Tabs>

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

      {/* Settings Tab – Third-party: Email, WhatsApp, SMS */}
      {/* Live chat tab: waiting sessions + join + chat with user */}
      {activeTab === 5 && (
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

      {activeTab === 6 && (
        <Box display="flex" flexDirection="column" gap={3}>
          {tpError && <Alert severity="error" onClose={() => setTpError('')}>{tpError}</Alert>}
          {tpLoading ? (
            <Box display="flex" alignItems="center" gap={2}><CircularProgress size={24} /> Loading settings…</Box>
          ) : (
            <>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">General (Login page &amp; nav)</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Nav login button label"
                        value={tpEdit.general?.nav_login_label ?? ''}
                        onChange={(e) => updateTpEdit('general', 'nav_login_label', e.target.value)}
                        placeholder="Login"
                        fullWidth
                        size="small"
                        helperText="Text shown on the top navigation Login button"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Login page credentials (JSON array)"
                        value={tpEdit.general?.login_page_credentials ?? ''}
                        onChange={(e) => updateTpEdit('general', 'login_page_credentials', e.target.value)}
                        fullWidth
                        multiline
                        minRows={6}
                        size="small"
                        placeholder='[{"role":"employer","email":"employer@israel.com","password":"employer123","name":"Israeli Employer","description":"Post jobs"}]'
                        helperText='Array of objects: role, email, password, name, description. Shown as test credential cards on /login.'
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
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
                        type="password"
                        value={tpEdit.whatsapp?.interakt_api_key ?? ''}
                        onChange={(e) => updateTpEdit('whatsapp', 'interakt_api_key', e.target.value)}
                        placeholder="Leave blank to keep current"
                        fullWidth
                        size="small"
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
                        type="password"
                        value={tpEdit.sms?.twilio_auth_token ?? ''}
                        onChange={(e) => updateTpEdit('sms', 'twilio_auth_token', e.target.value)}
                        placeholder="Leave blank to keep current"
                        fullWidth
                        size="small"
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
              <Button variant="contained" onClick={handleSaveThirdPartySettings} disabled={tpSaving}>
                {tpSaving ? <CircularProgress size={24} /> : 'Save all settings'}
              </Button>
            </>
          )}
        </Box>
      )}

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
    </Box>
  );
};

export default ApravasAdminDashboard;
