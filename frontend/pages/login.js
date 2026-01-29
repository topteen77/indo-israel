import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Business,
  Person,
  ContentCopy,
  CheckCircle,
} from '@mui/icons-material';
import { API_BASE_URL } from '../utils/api';

// Available login credentials
const loginCredentials = [
  {
    role: 'admin',
    email: 'admin@apravas.com',
    password: 'admin123',
    name: 'Apravas Admin',
    icon: AdminPanelSettings,
    color: '#d32f2f',
    description: 'Full access to all features and data',
  },
  {
    role: 'employer',
    email: 'employer@israel.com',
    password: 'employer123',
    name: 'Israeli Employer',
    icon: Business,
    color: '#1976d2',
    description: 'Post jobs and manage applications',
  },
  {
    role: 'employer',
    email: 'employer2@israel.com',
    password: 'employer123',
    name: 'Sarah Levy',
    icon: Business,
    color: '#1976d2',
    description: 'Post jobs and manage applications',
  },
  {
    role: 'worker',
    email: 'worker@india.com',
    password: 'worker123',
    name: 'Rajesh Kumar',
    icon: Person,
    color: '#2e7d32',
    description: 'Browse jobs and submit applications',
  },
  {
    role: 'worker',
    email: 'worker2@india.com',
    password: 'worker123',
    name: 'Amit Sharma',
    icon: Person,
    color: '#2e7d32',
    description: 'Browse jobs and submit applications',
  },
  {
    role: 'worker',
    email: 'worker3@india.com',
    password: 'worker123',
    name: 'Priya Patel',
    icon: Person,
    color: '#2e7d32',
    description: 'Browse jobs and submit applications',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect based on role
        if (data.user.role === 'admin') {
          router.push('/dashboard/admin');
        } else if (data.user.role === 'employer') {
          router.push('/dashboard/employer');
        } else if (data.user.role === 'worker') {
          router.push('/dashboard/worker');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (credential) => {
    setEmail(credential.email);
    setPassword(credential.password);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: credential.email, password: credential.password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'admin') {
          router.push('/dashboard/admin');
        } else if (data.user.role === 'employer') {
          router.push('/dashboard/employer');
        } else if (data.user.role === 'worker') {
          router.push('/dashboard/worker');
        }
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#d32f2f';
      case 'employer':
        return '#1976d2';
      case 'worker':
        return '#2e7d32';
      default:
        return '#666';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'employer':
        return 'Employer';
      case 'worker':
        return 'Worker';
      default:
        return role;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Login Form */}
          <Grid item xs={12} md={5}>
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
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mb: 2, py: 1.5 }}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push('/')}
                    sx={{ py: 1.5 }}
                  >
                    Back to Home
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Credentials Display */}
          <Grid item xs={12} md={7}>
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                  Test Credentials
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Click on any credential card to login instantly, or copy credentials to use in the form
                </Typography>

                <Grid container spacing={2}>
                  {loginCredentials.map((credential, index) => {
                    const Icon = credential.icon;
                    return (
                      <Grid item xs={12} sm={6} key={index}>
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2,
                            border: `2px solid ${credential.color}20`,
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: credential.color,
                              transform: 'translateY(-2px)',
                              boxShadow: 4,
                            },
                          }}
                          onClick={() => quickLogin(credential)}
                        >
                          <Box display="flex" alignItems="center" mb={1.5}>
                            <Box
                              sx={{
                                bgcolor: `${credential.color}15`,
                                p: 1,
                                borderRadius: 1,
                                mr: 1.5,
                              }}
                            >
                              <Icon sx={{ color: credential.color }} />
                            </Box>
                            <Box flex={1}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {credential.name}
                              </Typography>
                              <Chip
                                label={getRoleLabel(credential.role)}
                                size="small"
                                sx={{
                                  bgcolor: `${credential.color}20`,
                                  color: credential.color,
                                  fontWeight: 600,
                                  mt: 0.5,
                                }}
                              />
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1.5 }} />

                          <Box mb={1}>
                            <Box display="flex" alignItems="center" mb={0.5}>
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                                Email:
                              </Typography>
                              <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace' }}>
                                {credential.email}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(credential.email, `email-${index}`);
                                }}
                                sx={{ ml: 0.5 }}
                              >
                                {copiedField === `email-${index}` ? (
                                  <CheckCircle fontSize="small" color="success" />
                                ) : (
                                  <ContentCopy fontSize="small" />
                                )}
                              </IconButton>
                            </Box>

                            <Box display="flex" alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                                Password:
                              </Typography>
                              <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace' }}>
                                {credential.password}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(credential.password, `password-${index}`);
                                }}
                                sx={{ ml: 0.5 }}
                              >
                                {copiedField === `password-${index}` ? (
                                  <CheckCircle fontSize="small" color="success" />
                                ) : (
                                  <ContentCopy fontSize="small" />
                                )}
                              </IconButton>
                            </Box>
                          </Box>

                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {credential.description}
                          </Typography>

                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            sx={{
                              mt: 2,
                              bgcolor: credential.color,
                              '&:hover': { bgcolor: credential.color, opacity: 0.9 },
                            }}
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
