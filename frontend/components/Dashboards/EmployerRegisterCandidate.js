import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  PersonAdd,
  PersonAddOutlined,
  Work,
  People,
  Assessment,
  CheckCircle,
  Dashboard,
  Gavel,
  MenuBook,
  VerifiedUser,
} from '@mui/icons-material';
import api from '../../utils/api';
import DashboardShell from '../Layout/DashboardShell';

const JOB_CATEGORIES = [
  'Construction',
  'Healthcare',
  'Agriculture',
  'Hospitality',
  'IT Support',
  'Nursing',
  'Plumber',
  'Electrician',
  'Carpenter',
  'Driver',
  'Security Guard',
];

export default function EmployerRegisterCandidate() {
  const router = useRouter();
  const [shellUser, setShellUser] = useState({ display: '', role: 'employer' });
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    jobId: '',
    dateOfBirth: '',
    gender: '',
    hasPassport: 'no',
    jobCategory: '',
    specificTrade: '',
    experienceYears: '',
    permanentAddress: '',
    stateRegion: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/dashboards/employer');
        if (!cancelled && res.data?.data) setDashboardData(res.data.data);
      } catch (e) {
        if (!cancelled) setSnackbar({ open: true, message: 'Could not load your jobs', severity: 'error' });
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleNav = (id) => {
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
    router.push(id === 0 ? '/dashboard/employer' : `/dashboard/employer?tab=${id}`);
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.mobileNumber.trim()) e.mobileNumber = 'Required';
    if (!form.jobId) e.jobId = 'Select a job';
    if (!form.dateOfBirth) e.dateOfBirth = 'Required';
    if (!form.gender) e.gender = 'Required';
    if (!form.jobCategory) e.jobCategory = 'Required';
    if (form.experienceYears === '' || form.experienceYears == null) e.experienceYears = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/applications/employer-candidate', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobileNumber.trim(),
        jobId: form.jobId,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        hasPassport: form.hasPassport,
        jobCategory: form.jobCategory,
        specificTrade: form.specificTrade.trim() || undefined,
        experienceYears: form.experienceYears,
        permanentAddress: form.permanentAddress.trim() || undefined,
        stateRegion: form.stateRegion.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      if (res.data?.success) {
        setSnackbar({ open: true, message: 'Candidate registered successfully', severity: 'success' });
        setForm({
          fullName: '',
          email: '',
          mobileNumber: '',
          jobId: '',
          dateOfBirth: '',
          gender: '',
          hasPassport: 'no',
          jobCategory: '',
          specificTrade: '',
          experienceYears: '',
          permanentAddress: '',
          stateRegion: '',
          notes: '',
        });
        setErrors({});
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const jobs = dashboardData?.jobs?.jobs ?? [];

  return (
    <DashboardShell
      navGroups={employerNavGroups}
      activeId={5}
      onNavSelect={handleNav}
      topbarTitle="Register candidate"
      roleLabel={shellUser.role}
      userDisplayName={shellUser.display}
      onHome={() => router.push('/')}
      onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      }}
    >
      <Box mb={2}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/employer')}
          sx={{ textTransform: 'none', color: 'text.secondary', mb: 1 }}
        >
          Back to dashboard
        </Button>
        <Typography variant="h4" component="h1" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
          Register candidate
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Add a candidate to one of your job postings. They appear in your pipeline for review.
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{ borderRadius: 2, border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {loadingJobs ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : jobs.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              You have no job postings yet. Post a job first, then register candidates against it.
            </Alert>
          ) : null}

          {!loadingJobs && jobs.length > 0 ? (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Full name"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Mobile number"
                    value={form.mobileNumber}
                    onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))}
                    error={!!errors.mobileNumber}
                    helperText={errors.mobileNumber}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Date of birth"
                    InputLabelProps={{ shrink: true }}
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required error={!!errors.gender}>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      label="Gender"
                      value={form.gender}
                      onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                    {errors.gender ? <FormHelperText>{errors.gender}</FormHelperText> : null}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Has passport</InputLabel>
                    <Select
                      label="Has passport"
                      value={form.hasPassport}
                      onChange={(e) => setForm((f) => ({ ...f, hasPassport: e.target.value }))}
                    >
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required error={!!errors.jobId}>
                    <InputLabel>Job posting</InputLabel>
                    <Select
                      label="Job posting"
                      value={form.jobId}
                      onChange={(e) => setForm((f) => ({ ...f, jobId: e.target.value }))}
                    >
                      {jobs.map((j) => (
                        <MenuItem key={j.id} value={j.id}>
                          {j.title} — {j.location}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.jobId ? <FormHelperText>{errors.jobId}</FormHelperText> : null}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required error={!!errors.jobCategory}>
                    <InputLabel>Category / trade group</InputLabel>
                    <Select
                      label="Category / trade group"
                      value={form.jobCategory}
                      onChange={(e) => setForm((f) => ({ ...f, jobCategory: e.target.value }))}
                    >
                      {JOB_CATEGORIES.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.jobCategory ? <FormHelperText>{errors.jobCategory}</FormHelperText> : null}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Specific trade (optional)"
                    placeholder="e.g. Welder (MIG/TIG)"
                    value={form.specificTrade}
                    onChange={(e) => setForm((f) => ({ ...f, specificTrade: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Years of experience"
                    inputProps={{ min: 0, max: 60 }}
                    value={form.experienceYears}
                    onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
                    error={!!errors.experienceYears}
                    helperText={errors.experienceYears}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="State / region"
                    placeholder="e.g. Punjab"
                    value={form.stateRegion}
                    onChange={(e) => setForm((f) => ({ ...f, stateRegion: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Address (optional)"
                    value={form.permanentAddress}
                    onChange={(e) => setForm((f) => ({ ...f, permanentAddress: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Internal notes (optional)"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    helperText="Visible in routing metadata for your team"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting}
                      startIcon={submitting ? undefined : <PersonAdd />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 3,
                        bgcolor: '#7B0FF5',
                        '&:hover': { bgcolor: '#9D4EDD' },
                      }}
                    >
                      {submitting ? 'Saving…' : 'Register candidate'}
                    </Button>
                    <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={() => router.push('/dashboard/employer?tab=2')}>
                      View pipeline
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardShell>
  );
}
