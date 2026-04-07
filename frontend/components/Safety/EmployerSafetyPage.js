import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  MyLocation,
  ReportProblem,
  Favorite,
  People,
  CheckCircle,
  LocationOff,
  ErrorOutline,
  GpsFixed,
  Refresh,
  Public,
  Shield,
  VerifiedUser,
  SignalCellularAlt,
  BatteryStd,
  Dashboard,
  Work,
  Assessment,
  PersonAddOutlined,
  Gavel,
  MenuBook,
} from '@mui/icons-material';
import DashboardShell from '../Layout/DashboardShell';
import api from '../../utils/api';

const TAB_KEYS = ['gps', 'sos', 'welfare'];

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ marginTop: 16 }}>
      {value === index ? children : null}
    </div>
  );
}

export default function EmployerSafetyPage() {
  const router = useRouter();
  const [shellUser, setShellUser] = useState({ display: '', role: 'employer', company: 'Your company' });
  const [navBadges, setNavBadges] = useState({ jobs: 0, pipe: 0 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setShellUser({
        display: u.fullName || u.name || u.email || u.companyName || 'Employer',
        role: u.role || 'employer',
        company: u.companyName || u.fullName || u.name || 'Your company',
      });
    } catch (_) {
      setShellUser({ display: 'Employer', role: 'employer', company: 'Your company' });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/dashboards/employer');
        if (!cancelled && res.data?.data) {
          const d = res.data.data;
          setNavBadges({
            jobs: d?.jobs?.activeJobs ?? 0,
            pipe: (d?.pipeline?.candidates ?? []).length,
          });
        }
      } catch (_) {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.tab;
    if (typeof q === 'string') {
      const idx = TAB_KEYS.indexOf(q.toLowerCase());
      if (idx >= 0) setTab(idx);
    }
  }, [router.isReady, router.query.tab]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/safety/employer/summary');
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError('Could not load safety data');
      }
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401) {
        setError('Please sign in as an employer to view this data.');
      } else {
        setError('Failed to load safety data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResolveEmergency = async (historyId) => {
    if (historyId == null) return;
    try {
      setResolvingId(historyId);
      setError(null);
      await api.post('/safety/employer/emergency/resolve', { historyId });
      await load();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || 'Could not close alert';
      setError(msg);
    } finally {
      setResolvingId(null);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const employerNavGroups = useMemo(
    () => [
      {
        section: 'Employer',
        items: [
          { id: 0, label: 'Dashboard', icon: <Dashboard /> },
          {
            id: 1,
            label: 'Active Jobs',
            icon: <Work />,
            ...(navBadges.jobs ? { badge: navBadges.jobs } : {}),
          },
          {
            id: 2,
            label: 'Candidate Pipeline',
            icon: <People />,
            ...(navBadges.pipe ? { badge: navBadges.pipe } : {}),
          },
          { id: 3, label: 'Performance', icon: <Assessment /> },
          { id: 4, label: 'Compliance', icon: <CheckCircle /> },
          { id: 5, label: 'Register candidate', icon: <PersonAddOutlined /> },
          { id: 6, label: 'Contracts', icon: <Gavel /> },
          { id: 7, label: 'Resources', icon: <MenuBook /> },
          { id: 8, label: 'Safety & Welfare', icon: <VerifiedUser /> },
        ],
      },
    ],
    [navBadges.jobs, navBadges.pipe]
  );

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

  const onTabChange = (_, v) => {
    setTab(v);
    router.replace(
      { pathname: '/dashboard/employer/safety', query: { tab: TAB_KEYS[v] } },
      undefined,
      { shallow: true }
    );
  };

  const openMaps = (lat, lng) => {
    if (lat == null || lng == null) return;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  const shellProps = {
    navGroups: employerNavGroups,
    activeId: 8,
    onNavSelect: handleNav,
    topbarTitle: 'Safety & Welfare',
    roleLabel: shellUser.role,
    userDisplayName: shellUser.display,
    onHome: () => router.push('/'),
    onLogout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    },
  };

  if (loading && !data) {
    return (
      <DashboardShell {...shellProps}>
        <Box sx={{ py: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Loading safety & welfare…
          </Typography>
        </Box>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell {...shellProps}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <VerifiedUser />
              </Avatar>
              <Typography variant="h5" component="h1" fontWeight={800} sx={{ color: '#1e293b' }}>
                Safety & Welfare
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Monitor deployed workers linked to <strong>{data?.companyName || shellUser.company}</strong> — GPS,
              emergency response, and welfare check-ins.
            </Typography>
          </Box>
          <IconButton onClick={load} aria-label="Refresh" sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Refresh />
          </IconButton>
        </Stack>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            mb: 2,
          }}
        >
          <Tabs
            value={tab}
            onChange={onTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52 },
            }}
          >
            <Tab icon={<MyLocation sx={{ fontSize: 20 }} />} iconPosition="start" label="GPS tracking" />
            <Tab icon={<ReportProblem sx={{ fontSize: 20 }} />} iconPosition="start" label="Safety & SOS" />
            <Tab icon={<Favorite sx={{ fontSize: 20 }} />} iconPosition="start" label="Welfare checks" />
          </Tabs>
        </Paper>

        <TabPanel value={tab} index={0}>
          <GpsTab data={data} onTrack={openMaps} />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <SosTab data={data} onResolveEmergency={handleResolveEmergency} resolvingId={resolvingId} />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <WelfareTab data={data} />
        </TabPanel>
      </Box>
    </DashboardShell>
  );
}

function GpsTab({ data, onTrack }) {
  const stats = data?.stats;
  const workers = data?.workers || [];

  const cards = [
    {
      label: 'Total workers',
      value: stats?.total ?? 0,
      color: '#1976d2',
      icon: <People />,
    },
    {
      label: 'Active & safe',
      value: stats?.activeSafe ?? 0,
      color: '#2e7d32',
      icon: <CheckCircle />,
    },
    {
      label: 'Offline',
      value: stats?.offline ?? 0,
      color: '#ed6c02',
      icon: <LocationOff />,
    },
    {
      label: 'SOS alerts',
      value: stats?.sos ?? 0,
      color: '#d32f2f',
      icon: <ErrorOutline />,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <GpsFixed color="primary" />
        Real-time GPS tracking & worker safety
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Live overview of applicants on your job postings and linked worker accounts (GPS when the worker logs in and shares
        location).
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.label}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${c.color}22 0%, #fff 100%)`,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {c.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: c.color }}>
                      {c.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: `${c.color}33`, color: c.color }}>{c.icon}</Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper
        variant="outlined"
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          borderRadius: 2,
          bgcolor: 'grey.50',
          minHeight: 280,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <Public sx={{ fontSize: 56, color: 'text.disabled' }} />
        <Typography variant="h6" fontWeight={700}>
          Interactive world map
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time worker locations displayed here
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Integration: Google Maps API / Mapbox — connect your key for live map.
        </Typography>
      </Paper>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Workers
      </Typography>
      {workers.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No applicants on your jobs yet, or applicants have not linked a worker account. GPS appears after a worker logs in and
          shares location.
        </Alert>
      )}
      <Stack spacing={1.5}>
        {workers.map((w) => {
          const lat = w.location?.latitude;
          const lng = w.location?.longitude;
          const st = w.status?.current;
          const isSafe = st === 'safe';
          const isCrit = st === 'critical';
          const canTrack = w.hasLiveGps !== false && lat != null && lng != null;
          return (
            <Paper
              key={w.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: isCrit
                  ? 'rgba(211, 47, 47, 0.06)'
                  : isSafe
                    ? 'rgba(46, 125, 50, 0.06)'
                    : 'rgba(237, 108, 2, 0.08)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>{w.name?.charAt(0) || 'W'}</Avatar>
                  <Box>
                    <Typography fontWeight={700}>{w.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {w.displayLocation || w.location?.address || '—'}
                      {w.city || w.country ? ` · ${[w.city, w.country].filter(Boolean).join(', ')}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {w.jobTitle} · {w.employer}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Chip
                    size="small"
                    label={isSafe ? 'Active' : isCrit ? 'SOS' : 'Offline'}
                    color={isSafe ? 'success' : isCrit ? 'error' : 'warning'}
                    sx={{ fontWeight: 700 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Last seen: {w.lastSeenLabel}
                  </Typography>
                  {w.batteryPct != null && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <BatteryStd
                        sx={{ fontSize: 18, color: w.batteryPct < 30 ? 'error.main' : 'success.main' }}
                      />
                      <Typography variant="caption">{w.batteryPct}%</Typography>
                    </Stack>
                  )}
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <SignalCellularAlt sx={{ fontSize: 18, color: isSafe ? 'success.main' : 'warning.main' }} />
                    <Typography variant="caption">{w.signalLabel}</Typography>
                  </Stack>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<MyLocation />}
                    disabled={!canTrack}
                    onClick={() => canTrack && onTrack(lat, lng)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Track
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

function SosTab({ data, onResolveEmergency, resolvingId }) {
  const incidents = data?.recentIncidents || [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            height: '100%',
            borderColor: 'error.light',
            bgcolor: 'rgba(211, 47, 47, 0.04)',
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Shield color="error" />
              <Typography variant="h6" fontWeight={700}>
                Emergency protocol
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              24/7 dual emergency response system with local helpline and family contact.
            </Typography>
            <List dense>
              {[
                'Instant SOS activation from mobile app',
                'GPS location automatically shared',
                'Average response time: 3.2 minutes',
                'Police / medical coordination available',
              ].map((txt) => (
                <ListItem key={txt} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={txt} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Recent incidents
            </Typography>
            <Stack spacing={1.5}>
              {incidents.map((inc) => (
                <Paper
                  key={inc.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor:
                      inc.variant === 'success'
                        ? 'rgba(46, 125, 50, 0.08)'
                        : inc.variant === 'error'
                          ? 'rgba(211, 47, 47, 0.08)'
                          : 'grey.50',
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        fontWeight={700}
                        color={
                          inc.variant === 'success' ? 'success.main' : inc.variant === 'error' ? 'error.main' : 'text.primary'
                        }
                      >
                        {inc.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {inc.subtitle}
                      </Typography>
                      {inc.when ? (
                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                          {inc.when}
                        </Typography>
                      ) : null}
                    </Box>
                    {inc.canResolve && inc.historyId != null && typeof onResolveEmergency === 'function' ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        disabled={resolvingId === inc.historyId}
                        onClick={() => onResolveEmergency(inc.historyId)}
                        sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
                      >
                        {resolvingId === inc.historyId ? (
                          <CircularProgress size={22} color="inherit" />
                        ) : (
                          'Acknowledge & close'
                        )}
                      </Button>
                    ) : null}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function WelfareTab({ data }) {
  const w = data?.welfare;

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Favorite color="error" />
        Worker welfare monitoring
      </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Regular monitoring of worker well-being, accommodation, and working conditions — aggregated from interviews and
          check-ins on your roles.
        </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
          mb: 3,
        }}
      >
        <Favorite sx={{ fontSize: 48, color: 'error.light', mb: 1 }} />
        <Typography variant="h6" fontWeight={700}>
          Weekly welfare check-ins
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Metrics update from interview assessments and safety check-ins for workers linked to your job postings.
        </Typography>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'rgba(46, 125, 50, 0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h4" fontWeight={800} color="success.main">
                {w?.completed ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {w?.avgScore ?? 0}/5
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Avg score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'rgba(123, 15, 245, 0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#7B0FF5' }}>
                {w?.satisfactionPct ?? 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Satisfaction
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
