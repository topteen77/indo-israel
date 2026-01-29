import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Chip,
  LinearProgress, CircularProgress, Button, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  Alert,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, People, Work, AttachMoney,
  Speed, CheckCircle, Schedule, Assessment,
  Visibility, Download, FilterList, Refresh, SafetyCheck,
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
    </Box>
  );
};

export default ApravasAdminDashboard;
