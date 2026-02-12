import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Business, Person, AdminPanelSettings, Visibility, VisibilityOff } from '@mui/icons-material';
import { API_BASE_URL } from '../utils/api';

const roleIcon = { admin: AdminPanelSettings, employer: Business, worker: Person };
const roleColor = { admin: '#d32f2f', employer: '#1976d2', worker: '#2e7d32' };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/login-credentials`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.credentials)) setCredentials(data.credentials);
        if (typeof data.showDemoCredentials === 'boolean') setShowDemoCredentials(data.showDemoCredentials);
      })
      .catch(() => setCredentials([]))
      .finally(() => setCredentialsLoading(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { success: false, message: 'Invalid response from server. Is the backend running?' };
      }
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        const nextUrl = typeof router.query.next === 'string' ? decodeURIComponent(router.query.next) : '';
        const isEmployerPath = nextUrl.startsWith('/dashboard/employer');
        const isAllowedNext = nextUrl && (nextUrl.startsWith('/dashboard/') || nextUrl.startsWith('/'));
        if (data.user.role === 'employer' && isAllowedNext && isEmployerPath) {
          router.push(nextUrl);
        } else if (data.user.role === 'admin') router.push('/dashboard/admin');
        else if (data.user.role === 'employer') router.push('/dashboard/employer');
        else if (data.user.role === 'worker') router.push('/dashboard/worker');
        else router.push(nextUrl || '/');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (credential) => {
    setError('');
    // Populate login form with this demo account's email (and password if provided)
    setEmail(credential.email);
    setPassword(credential.password || '');
    setLoading(true);
    try {
      const hasPassword = credential.password != null && String(credential.password).trim() !== '';
      const url = credential.demoOnly || !hasPassword ? `${API_BASE_URL}/auth/login-as-demo` : `${API_BASE_URL}/auth/login`;
      const body = hasPassword ? { email: credential.email, password: credential.password } : { email: credential.email };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { success: false, message: 'Invalid response from server. Is the backend running?' };
      }
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        const nextUrl = typeof router.query.next === 'string' ? decodeURIComponent(router.query.next) : '';
        const isEmployerPath = nextUrl.startsWith('/dashboard/employer');
        const isAllowedNext = nextUrl && (nextUrl.startsWith('/dashboard/') || nextUrl.startsWith('/'));
        if (data.user.role === 'employer' && isAllowedNext && isEmployerPath) {
          router.push(nextUrl);
        } else if (data.user.role === 'admin') router.push('/dashboard/admin');
        else if (data.user.role === 'employer') router.push('/dashboard/employer');
        else if (data.user.role === 'worker') router.push('/dashboard/worker');
        else router.push(nextUrl || '/');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) =>
    role === 'admin' ? 'Admin' : role === 'employer' ? 'Employer' : role === 'worker' ? 'Worker' : role || '';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={showDemoCredentials ? 5 : 12}>
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                  Login
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Sign in to access your dashboard
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}
                <Box component="form" onSubmit={handleLogin}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                    autoComplete="email"
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={{ mb: 3 }}
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mb: 2, py: 1.5 }}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                  <Button fullWidth variant="outlined" onClick={() => router.push('/')} sx={{ py: 1.5 }}>
                    Back to Home
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {showDemoCredentials && (
            <Grid item xs={12} md={7}>
              <Card elevation={3}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                    Demo accounts
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Click a card to log in
                  </Typography>
                  {credentialsLoading ? (
                    <Typography color="text.secondary">Loading…</Typography>
                  ) : credentials.length === 0 ? (
                    <Typography color="text.secondary">No demo credentials configured. Admin → Settings → General.</Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {credentials.map((credential, index) => {
                        const role = (credential.role || 'worker').toLowerCase();
                        const Icon = roleIcon[role] || Person;
                        const color = roleColor[role] || '#666';
                        return (
                          <Grid item xs={12} sm={6} key={index}>
                            <Paper
                              elevation={2}
                              sx={{
                                p: 2,
                                border: `2px solid ${color}20`,
                                borderRadius: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: color, transform: 'translateY(-2px)', boxShadow: 4 },
                              }}
                              onClick={() => quickLogin(credential)}
                            >
                              <Box display="flex" alignItems="center" mb={1.5}>
                                <Box sx={{ bgcolor: `${color}15`, p: 1, borderRadius: 1, mr: 1.5 }}>
                                  <Icon sx={{ color }} />
                                </Box>
                                <Box flex={1}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {credential.name || credential.email}
                                  </Typography>
                                  <Chip
                                    label={getRoleLabel(credential.role)}
                                    size="small"
                                    sx={{ bgcolor: `${color}20`, color, fontWeight: 600, mt: 0.5 }}
                                  />
                                </Box>
                              </Box>
                              {credential.description && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}
                                >
                                  {credential.description}
                                </Typography>
                              )}
                              <Button
                                fullWidth
                                variant="contained"
                                size="small"
                                disabled={loading}
                                sx={{ mt: 1, bgcolor: color, '&:hover': { bgcolor: color, opacity: 0.9 } }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickLogin(credential);
                                }}
                              >
                                Login as {getRoleLabel(credential.role)}
                              </Button>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
