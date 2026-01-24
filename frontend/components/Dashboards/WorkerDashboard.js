import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button,
  LinearProgress, Chip, Avatar, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableHead, TableRow,
  Badge, Alert, Tab, Tabs, CircularProgress,
} from '@mui/material';
import {
  Work, School, Schedule, CheckCircle, Warning,
  TrendingUp, AttachMoney, Timeline, Assessment, GetApp,
  CloudUpload, Notifications, Settings, VerifiedUser,
} from '@mui/icons-material';
import WorkerSafetyDashboard from '../Safety/WorkerSafetyDashboard';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../../utils/api';

const WorkerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 180000); // 3 min refresh
    return () => clearInterval(interval);
  }, []);

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
        <Typography variant="h4">My Dashboard</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
          >
            Download Report
          </Button>
          <Button
            variant="contained"
            startIcon={<Settings />}
          >
            Settings
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
                  {dashboardData.profile.fullName.charAt(0)}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h4">Welcome back, {dashboardData.profile.fullName}!</Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {dashboardData.profile.skills?.length || 0} skills • {dashboardData.profile.experience} years experience
                </Typography>
                <Box display="flex" gap={2} mt={1}>
                  <Chip
                    label={`${dashboardData.timeline.overallProgress}% Complete`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip
                    label={`Skill Score: ${dashboardData.skills.skillScore}%`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                  startIcon={<Work />}
                >
                  Find Jobs
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
              <Typography variant="h4">{dashboardData.applications.active}</Typography>
              <Typography variant="body2" color="textSecondary">Active Applications</Typography>
              <Typography variant="caption" color="success.main">
                {dashboardData.applications.approved} approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{dashboardData.timeline.currentStep?.replace('_', ' ') || 'Not Started'}</Typography>
              <Typography variant="body2" color="textSecondary">Current Stage</Typography>
              <Typography variant="caption" color="textSecondary">
                {dashboardData.timeline.overallProgress}% complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{dashboardData.documents.verified}</Typography>
              <Typography variant="body2" color="textSecondary">Verified Documents</Typography>
              <Typography variant="caption" color="warning.main">
                {dashboardData.documents.pending} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{dashboardData.skills.skillScore}%</Typography>
              <Typography variant="body2" color="textSecondary">Skill Score</Typography>
              <Typography variant="caption" color="textSecondary">
                Market ready
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
      >
        <Tab label="Overview" icon={<Assessment />} />
        <Tab label="Applications" icon={<Work />} />
        <Tab label="Documents" icon={<GetApp />} />
        <Tab label="Skills & Learning" icon={<School />} />
        <Tab label="Safety & Welfare" icon={<VerifiedUser />} />
        <Tab label="Timeline" icon={<Timeline />} />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Application Timeline</Typography>
                <Stepper activeStep={dashboardData.timeline.currentStepIndex || 0} orientation="vertical">
                  {dashboardData.timeline.milestones?.map((milestone, index) => (
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
                <Typography variant="h6" gutterBottom>Recent Notifications</Typography>
                {dashboardData.notifications.slice(0, 5).map((notification, index) => (
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
            <Typography variant="h6" gutterBottom>My Applications</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Applied Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.applications.applications.map((application) => (
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
                      {new Date(application.applied_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Document Status</Typography>
                <Grid container spacing={2}>
                  {dashboardData.documents.documents.map((doc, index) => (
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
                              >
                                Upload
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

      {/* Skills Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Skill Assessment</Typography>
                <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column">
                  <CircularProgress
                    variant="determinate"
                    value={dashboardData.skills.skillScore}
                    size={120}
                    thickness={4}
                  />
                  <Typography variant="h4" sx={{ mt: 2 }}>
                    {dashboardData.skills.skillScore}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Market Ready Score
                  </Typography>
                </Box>
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>Current Skills</Typography>
                  {dashboardData.skills.currentSkills.skills?.slice(0, 5).map((skill, index) => (
                    <Chip key={index} label={skill} size="small" sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recommended Learning</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Impact</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.skills.recommendations.slice(0, 5).map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>{course.title}</TableCell>
                        <TableCell>{course.provider}</TableCell>
                        <TableCell>{course.duration}</TableCell>
                        <TableCell>
                          <Chip
                            label={`+${course.skillPoints} points`}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                          >
                            Enroll
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Safety & Welfare Tab */}
      {activeTab === 4 && dashboardData && (
        <Box sx={{ p: 3 }}>
          <WorkerSafetyDashboard workerId={dashboardData.workerId || '1'} />
        </Box>
      )}

      {/* Timeline Tab */}
      {activeTab === 5 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Application Timeline</Typography>
            <Stepper activeStep={dashboardData.timeline.currentStepIndex || 0} alternativeLabel>
              {dashboardData.timeline.milestones?.map((milestone, index) => (
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
    </Box>
  );
};

export default WorkerDashboard;
