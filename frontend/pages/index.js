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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Chip,
  Stack,
  Fade,
  Grow,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Work,
  Business,
  Person,
  TrendingUp,
  Security,
  Language,
  CheckCircle,
  Speed,
  Analytics,
  VerifiedUser,
  People,
  Star,
  ArrowForward,
  Dashboard,
  Search,
  LocationOn,
  PhoneAndroid,
  PlayArrow,
  Download,
  TrendingFlat,
  BusinessCenter,
  School,
  Flight,
  Home as HomeIcon,
  ArrowUpward,
  Close,
  Send,
} from '@mui/icons-material';
import IndiaIsraelRecruitmentChatbot from '../components/Chatbot/IndiaIsraelRecruitmentChatbot';
import { API_BASE_URL } from '../utils/api';

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [enquiryDialogOpen, setEnquiryDialogOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    fullName: '',
    email: '',
    country: 'India',
    countryCode: '+91',
    phone: '',
    city: '',
    query: '',
  });
  const [enquirySnackbar, setEnquirySnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(u?.id ? u : null);
    } catch (_) {
      setUser(null);
    }
  }, []);

  // Seed credentials matching backend DB (same as /login page)
  const seedCredentials = {
    admin: { email: 'admin@apravas.com', password: 'admin123' },
    employer: { email: 'employer@israel.com', password: 'employer123' },
    worker: { email: 'worker@india.com', password: 'worker123' },
  };

  const handleLogin = async (loginRole = null) => {
    try {
      const roleToUse = loginRole || role;
      const creds = seedCredentials[roleToUse];
      const emailToUse = creds ? creds.email : email;
      const passwordToUse = creds ? creds.password : undefined;

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToUse,
          ...(passwordToUse && { password: passwordToUse }),
          ...(!passwordToUse && { role: roleToUse }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);

        // Check if we need to open post job dialog (from homepage button)
        const shouldOpenPostJob = typeof window !== 'undefined' && 
          sessionStorage.getItem('openPostJob') === 'true';
        
        if (data.user.role === 'admin') {
          router.push('/dashboard/admin');
        } else if (data.user.role === 'employer') {
          if (shouldOpenPostJob) {
            router.push('/dashboard/employer?openPostJob=true');
          } else {
            router.push('/dashboard/employer');
          }
        } else if (data.user.role === 'worker') {
          router.push('/dashboard/worker');
        }
      } else {
        alert(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const quickLogin = async (selectedRole) => {
    // Directly call handleLogin with the role parameter
    await handleLogin(selectedRole);
  };

  const trendingJobs = [
    { title: 'Construction Workers', openings: 1245, icon: Work, color: '#1976d2' },
    { title: 'Healthcare Assistants', openings: 892, icon: People, color: '#2e7d32' },
    { title: 'Agriculture Workers', openings: 756, icon: HomeIcon, color: '#ed6c02' },
    { title: 'Hospitality Staff', openings: 634, icon: BusinessCenter, color: '#9c27b0' },
    { title: 'IT Support', openings: 523, icon: Dashboard, color: '#0288d1' },
    { title: 'Nursing Staff', openings: 445, icon: VerifiedUser, color: '#d32f2f' },
  ];

  const popularSearches = [
    { label: 'Jobs for Freshers', count: '2,450+', trending: true },
    { label: 'Work from Home Jobs', count: '1,890+', trending: true },
    { label: 'Part Time Jobs', count: '1,234+', trending: true },
    { label: 'Jobs for Women', count: '1,567+', trending: true },
    { label: 'Full Time Jobs', count: '3,456+', trending: true },
  ];

  const jobCategories = [
    { name: 'Construction', icon: Work, openings: 1245, color: '#1976d2' },
    { name: 'Healthcare', icon: People, openings: 892, color: '#2e7d32' },
    { name: 'Agriculture', icon: HomeIcon, openings: 756, color: '#ed6c02' },
    { name: 'Hospitality', icon: BusinessCenter, openings: 634, color: '#9c27b0' },
    { name: 'IT Support', icon: Dashboard, openings: 523, color: '#0288d1' },
    { name: 'Nursing', icon: VerifiedUser, openings: 445, color: '#d32f2f' },
    { name: 'Cooking/Chef', icon: BusinessCenter, openings: 389, color: '#f57c00' },
    { name: 'Cleaning', icon: HomeIcon, openings: 312, color: '#5c6bc0' },
    { name: 'Security', icon: Security, openings: 278, color: '#455a64' },
    { name: 'Driver', icon: Flight, openings: 234, color: '#00796b' },
    { name: 'Electrician', icon: Work, openings: 198, color: '#f9a825' },
    { name: 'Plumber', icon: Work, openings: 156, color: '#00838f' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff', position: 'relative' }}>
      {/* Top Navigation Bar */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => router.push('/')}
            >
              APRAVAS
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={() => router.push('/')}
                sx={{ borderRadius: '25px', px: 3 }}
              >
                Home
              </Button>
              {mounted && user ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Dashboard />}
                    onClick={() => {
                      if (user.role === 'admin') router.push('/dashboard/admin');
                      else if (user.role === 'employer') router.push('/dashboard/employer');
                      else if (user.role === 'worker') router.push('/dashboard/worker');
                      else router.push('/');
                    }}
                    sx={{ borderRadius: '25px', px: 3 }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      setUser(null);
                      router.push('/');
                    }}
                    sx={{ borderRadius: '25px', px: 3 }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => router.push('/login')}
                  sx={{ borderRadius: '25px', px: 3 }}
                >
                  Login
                </Button>
              )}
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Hero Section - Enhanced */}
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 8, md: 12 },
            mb: 8,
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: { xs: 0, md: 4 },
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Fade in timeout={800}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Chip
                label="🇮🇳 🇮🇱 Trusted by 50,000+ Workers."
                sx={{
                  mb: 3,
                  px: 3,
                  py: 1.5,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #7B0FF5 0%, #9D4EDD 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(123, 15, 245, 0.3)',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                  },
                }}
              />
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  mb: 2,
                  background: 'linear-gradient(135deg, #7B0FF5 0%, #9D4EDD 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                INDIA-ISRAEL #1 RECRUITMENT PLATFORM
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', md: '2.75rem' },
                  mb: 1.5,
                  color: '#1a1a1a',
                  letterSpacing: '-0.01em',
                }}
              >
                Your job search ends here
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  mb: 5,
                  color: '#666',
                  maxWidth: 700,
                  mx: 'auto',
                }}
              >
                Discover 50,000+ career opportunities in Israel with verified employers
              </Typography>

          {/* Chatbot Input Area */}
          <Box sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                background: 'rgba(255, 255, 255, 1)',
                border: '1.5px solid rgba(123, 15, 245, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(123, 15, 245, 0.08)',
                p: 3,
              }}
            >
              {/* Input Field */}
              <TextField
                fullWidth
                placeholder="Type your question here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => {
                  setChatbotOpen(true);
                }}
                onFocus={() => {
                  setChatbotOpen(true);
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    borderRadius: '12px',
                    bgcolor: 'transparent',
                    '& fieldset': {
                      border: 'none',
                    },
                    '& input': {
                      color: 'rgba(92, 92, 92, 1)',
                      fontSize: '1rem',
                      py: 1,
                      px: 1.5,
                      '&::placeholder': {
                      color: 'rgba(123, 15, 245, 0.6)',
                      opacity: 1,
                      },
                    },
                  },
                }}
              />

              {/* Suggested Questions Inline */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2,
                }}
              >
                {[
                  'What is the visa process?',
                  'Required documents?',
                  'Salary & benefits?',
                  'How to verify employer?',
                ].map((question, index) => (
                  <Chip
                    key={index}
                    label={question}
                    onClick={() => {
                      setSearchQuery(question);
                      setChatbotOpen(true);
                    }}
                    sx={{
                      border: '1px solid rgba(123, 15, 245, 0.3)',
                      borderRadius: '20px',
                      color: '#7B0FF5',
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      height: '32px',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: 'rgba(123, 15, 245, 0.08)',
                        borderColor: 'rgba(123, 15, 245, 0.5)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                    icon={
                      <ArrowUpward
                        sx={{
                          fontSize: '12px',
                          color: 'rgba(123, 15, 245, 0.6)',
                          transform: 'rotate(45deg)',
                        }}
                      />
                    }
                  />
                ))}
              </Box>

              {/* CTA Button */}
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setChatbotOpen(true);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #7B0FF5 0%, #9D4EDD 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: '12px',
                  py: 1.5,
                  fontSize: '1rem',
                  boxShadow: '0 4px 16px rgba(123, 15, 245, 0.25)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9D4EDD 0%, #7B0FF5 100%)',
                    boxShadow: '0 6px 24px rgba(123, 15, 245, 0.35)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
                endIcon={
                  <Star sx={{ color: '#FFD700', fontSize: 20 }} />
                }
              >
                Any other query? Ask ApravasGPT
              </Button>
            </Paper>
          </Box>

          {/* Trust Badges - Enhanced */}
          <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap" sx={{ mb: 6, mt: 4 }}>
            {[
              { label: 'NSDC Certified', color: '#1976d2', bgcolor: '#e3f2fd', icon: VerifiedUser },
              { label: 'PIBA Verified', color: '#2e7d32', bgcolor: '#e8f5e9', icon: CheckCircle },
              { label: 'GDPR Compliant', color: '#9c27b0', bgcolor: '#f3e5f5', icon: Security },
            ].map((badge, index) => (
              <Grow in timeout={1000 + index * 200} key={badge.label}>
                <Card
                  sx={{
                    px: 3,
                    py: 2,
                    borderRadius: 3,
                    bgcolor: badge.bgcolor,
                    border: `2px solid ${badge.color}20`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${badge.color}30`,
                      borderColor: badge.color,
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <badge.icon sx={{ color: badge.color, fontSize: 24 }} />
                    <Typography
                      sx={{
                        color: badge.color,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                    >
                      {badge.label}
                    </Typography>
                  </Stack>
                </Card>
              </Grow>
            ))}
          </Stack>
            </Box>
          </Fade>
        </Box>

        {/* Statistics Section - Enhanced with Frosted Glass Effect */}
        <Box
          sx={{
            background: 'linear-gradient(180deg, #7B0FF5 0%, #9D4EDD 50%, #B794F6 100%)',
            borderRadius: { xs: 3, md: 5 },
            p: { xs: 4, md: 6 },
            mb: 8,
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(123, 15, 245, 0.35)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              opacity: 0.6,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
              borderRadius: '50%',
              opacity: 0.5,
            },
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              mb: { xs: 4, md: 5 }, 
              color: 'white',
              fontSize: { xs: '1.1rem', md: '1.5rem' },
              position: 'relative',
              zIndex: 1,
              lineHeight: 1.4,
              maxWidth: 900,
              mx: 'auto',
              px: 2,
            }}
          >
            Trusted by 1000+ enterprises and 50,000+ workers for recruitment
          </Typography>
          <Grid 
            container 
            spacing={{ xs: 2, md: 3 }} 
            sx={{ 
              mt: 2, 
              position: 'relative', 
              zIndex: 1,
              justifyContent: 'center',
            }}
          >
            {[
              { value: '1,250+', label: 'Active Workers', icon: People },
              { value: '89+', label: 'Successful Placements', icon: TrendingUp },
              { value: '50+', label: 'Verified Employers', icon: Business },
              { value: '95%', label: 'Success Rate', icon: Star },
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Grow in timeout={1000 + index * 150}>
                  <Box
                    sx={{
                      p: { xs: 2.5, md: 3.5 },
                      borderRadius: { xs: 2.5, md: 3.5 },
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1.5px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
                        opacity: 0,
                        transition: 'opacity 0.4s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)',
                        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        '&::before': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        mb: { xs: 1.5, md: 2 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: { xs: 48, md: 56 },
                        height: { xs: 48, md: 56 },
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)',
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    >
                      <stat.icon 
                        sx={{ 
                          fontSize: { xs: 28, md: 32 }, 
                          color: 'white',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                        }} 
                      />
                    </Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 800, 
                        color: 'white', 
                        mb: { xs: 0.5, md: 1 },
                        fontSize: { xs: '1.75rem', md: '2.5rem' },
                        lineHeight: 1.1,
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.95)',
                        fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                        lineHeight: 1.4,
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Popular Searches Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a1a1a' }}>
            Popular Searches on Apravas
          </Typography>
          <Grid container spacing={2}>
            {popularSearches.map((search, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  onClick={() => router.push(`/jobs?search=${encodeURIComponent(search.label)}`)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      borderColor: '#7B0FF5',
                    },
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      {search.trending && (
                        <Chip
                          label={`TRENDING AT #${index + 1}`}
                          size="small"
                          sx={{
                            bgcolor: '#ffebee',
                            color: '#d32f2f',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            mb: 1,
                          }}
                        />
                      )}
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {search.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {search.count} openings
                      </Typography>
                    </Box>
                    <Button
                      variant="text"
                      endIcon={<TrendingFlat />}
                      sx={{ color: '#7B0FF5', fontWeight: 600 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/jobs?search=${encodeURIComponent(search.label)}`);
                      }}
                    >
                      View all
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* APRAVAS FOR EMPLOYERS Section - Enhanced */}
        <Box sx={{ mb: 8 }}>
          <Paper
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              position: 'relative',
              overflow: 'hidden',
              border: '2px solid rgba(46, 125, 50, 0.2)',
              boxShadow: '0 12px 40px rgba(46, 125, 50, 0.15)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: 'radial-gradient(circle, rgba(46, 125, 50, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
              },
            }}
          >
            <Grid container spacing={4} alignItems="center">
              {/* Left Side - People/Illustration */}
              <Grid item xs={12} md={4}>
                <Fade in timeout={1000}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '4px solid #2e7d32',
                        boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)',
                        transition: 'all 0.4s ease',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)',
                        },
                      }}
                    >
                      <People sx={{ fontSize: 70, color: '#2e7d32' }} />
                    </Box>
                    <Box
                      sx={{
                        width: 110,
                        height: 110,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '4px solid #2e7d32',
                        boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)',
                        mt: 4,
                        transition: 'all 0.4s ease',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(-5deg)',
                        },
                      }}
                    >
                      <Business sx={{ fontSize: 55, color: '#2e7d32' }} />
                    </Box>
                  </Box>
                </Fade>
              </Grid>

              {/* Right Side - Text and Button */}
              <Grid item xs={12} md={8}>
                <Fade in timeout={1200}>
                  <Box>
                    <Chip
                      label="APRAVAS FOR EMPLOYERS"
                      sx={{
                        bgcolor: 'rgba(46, 125, 50, 0.25)',
                        color: '#1b5e20',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        mb: 2.5,
                        px: 2,
                        py: 1,
                        border: '1px solid rgba(46, 125, 50, 0.4)',
                        boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                      }}
                    />
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        color: '#1b5e20',
                        mb: 2,
                        fontSize: { xs: '2.25rem', md: '3rem' },
                        lineHeight: 1.2,
                      }}
                    >
                      Want to hire?
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 500,
                        color: '#424242',
                        mb: 4,
                        fontSize: { xs: '1.1rem', md: '1.35rem' },
                        lineHeight: 1.6,
                      }}
                    >
                      Find the best candidates from 50,000+ active job seekers!
                    </Typography>
                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      onClick={async () => {
                        // Check if user is already logged in as employer
                        const token = localStorage.getItem('token');
                        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                        
                        if (token && storedUser.role === 'employer') {
                          // Already logged in as employer, navigate directly
                          router.push('/dashboard/employer?openPostJob=true');
                        } else {
                          // Set flag to open post job dialog after login
                          sessionStorage.setItem('openPostJob', 'true');
                          // Login as employer
                          await quickLogin('employer');
                        }
                      }}
                      sx={{
                        bgcolor: '#2e7d32',
                        color: 'white',
                        borderRadius: '30px',
                        px: 5,
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: '0 8px 24px rgba(46, 125, 50, 0.4)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: '#1b5e20',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 32px rgba(46, 125, 50, 0.5)',
                        },
                      }}
                    >
                      Post job
                    </Button>
                  </Box>
                </Fade>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Trending Job Roles - Enhanced */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800, 
                mb: 1, 
                color: '#1a1a1a',
                fontSize: { xs: '1.75rem', md: '2.5rem' },
              }}
            >
              Trending Job Roles on Apravas
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Explore in-demand positions across industries
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {jobCategories.map((job, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Grow in timeout={1000 + index * 100}>
                  <Card
                    onClick={() => router.push(`/jobs?category=${encodeURIComponent(job.name)}`)}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: `2px solid ${job.color}20`,
                      borderRadius: 3,
                      height: '100%',
                      background: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${job.color}08 0%, transparent 100%)`,
                        opacity: 0,
                        transition: 'opacity 0.4s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: `0 20px 40px ${job.color}30`,
                        borderColor: job.color,
                        '&::before': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" flexDirection="column" textAlign="center">
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '16px',
                          bgcolor: `${job.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          transition: 'all 0.4s ease',
                          '&:hover': {
                            transform: 'scale(1.1) rotate(5deg)',
                            bgcolor: `${job.color}25`,
                          },
                        }}
                      >
                        <job.icon sx={{ fontSize: 32, color: job.color }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 1,
                          color: '#1a1a1a',
                          fontSize: '1.1rem',
                        }}
                      >
                        {job.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Work sx={{ fontSize: 14 }} />
                        {job.openings} openings
                      </Typography>
                    </Box>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* AI Interview Assistant Section */}
        <Box
          sx={{
            bgcolor: '#f8f9fa',
            borderRadius: 3,
            p: 4,
            mb: 8,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
            AI Interview Assistant
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 3, color: '#666' }}>
            Practice interviews with Free AI Interview Coach
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<PlayArrow />}
            onClick={() => {
              window.open('https://cas.adventus.io/', '_blank', 'noopener,noreferrer');
            }}
            sx={{
              background: 'linear-gradient(135deg, #7B0FF5 0%, #9D4EDD 100%)',
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(123, 15, 245, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 24px rgba(123, 15, 245, 0.35)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Practice Now
          </Button>
        </Box>

        {/* Login Section for Dashboard Access - Hidden for now */}
        {/* <Box sx={{ mb: 8 }}>
          <Card
            sx={{
              maxWidth: 800,
              mx: 'auto',
              p: { xs: 3, md: 5 },
              background: 'white',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              borderRadius: 3,
            }}
          >
            <Box textAlign="center" mb={4}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                Access Your Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Login to access your personalized dashboard
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { role: 'admin', icon: Business, title: 'Admin', color: '#1976d2' },
                { role: 'employer', icon: Work, title: 'Employer', color: '#2e7d32' },
                { role: 'worker', icon: Person, title: 'Worker', color: '#ed6c02' },
              ].map((item) => (
                <Grid item xs={12} md={4} key={item.role}>
                  <Card
                    onClick={() => setRole(item.role)}
                    sx={{
                      cursor: 'pointer',
                      p: 3,
                      textAlign: 'center',
                      border: role === item.role ? 2 : 1,
                      borderColor: role === item.role ? item.color : '#e0e0e0',
                      bgcolor: role === item.role ? `${item.color}08` : 'white',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${item.color}30`,
                      },
                    }}
                  >
                    <item.icon sx={{ fontSize: 48, color: item.color, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Role</InputLabel>
              <Select value={role} onChange={(e) => setRole(e.target.value)} label="Role">
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="employer">Employer</MenuItem>
                <MenuItem value="worker">Worker</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`${role}@apravas.com`}
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleLogin}
              endIcon={<ArrowForward />}
              sx={{
                py: 1.5,
                mb: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '25px',
              }}
            >
              Login to Dashboard
            </Button>

            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={() => quickLogin('admin')}
                sx={{ borderRadius: '25px', px: 3 }}
              >
                Quick: Admin
              </Button>
              <Button
                variant="outlined"
                onClick={() => quickLogin('employer')}
                sx={{ borderRadius: '25px', px: 3 }}
              >
                Quick: Employer
              </Button>
              <Button
                variant="outlined"
                onClick={() => quickLogin('worker')}
                sx={{ borderRadius: '25px', px: 3 }}
              >
                Quick: Worker
              </Button>
            </Stack>
          </Card>
        </Box> */}

        {/* Contact Us Section - Enhanced */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(123, 15, 245, 0.03) 0%, rgba(157, 78, 221, 0.03) 100%)',
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            mb: 8,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid rgba(123, 15, 245, 0.1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -100,
              left: -100,
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(123, 15, 245, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -80,
              right: -80,
              width: 250,
              height: 250,
              background: 'radial-gradient(circle, rgba(157, 78, 221, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Chip
              label="📞 Get in Touch"
              sx={{
                mb: 3,
                px: 3,
                py: 1.5,
                fontSize: '0.9rem',
                fontWeight: 700,
                bgcolor: 'rgba(123, 15, 245, 0.15)',
                color: '#7B0FF5',
                border: '1px solid rgba(123, 15, 245, 0.3)',
              }}
            />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800, 
                mb: 2, 
                color: '#1a1a1a',
                fontSize: { xs: '1.75rem', md: '2.5rem' },
              }}
            >
              Contact Us
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 500, 
                mb: 4, 
                color: '#666',
                fontSize: { xs: '1rem', md: '1.25rem' },
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Have questions? We&apos;re here to help! Reach out to our team for support, partnerships, or general inquiries.
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={() => setEnquiryDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #7B0FF5 0%, #9D4EDD 100%)',
                  color: 'white',
                  px: 6,
                  py: 2,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(123, 15, 245, 0.4)',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(123, 15, 245, 0.5)',
                    background: 'linear-gradient(135deg, #9D4EDD 0%, #7B0FF5 100%)',
                  },
                }}
              >
                Enquiry Now
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          color: 'white',
          py: 6,
          mt: 8,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                APRAVAS
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                India-Israel #1 Recruitment Platform connecting skilled workers with opportunities.
              </Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Jobs
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Work From Home Jobs
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Part Time Jobs
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Jobs for Freshers
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Resources
              </Typography>
              <Stack spacing={1}>
                <Typography 
                  variant="body2" 
                  component="a"
                  href="/about-us.html"
                  sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', textDecoration: 'none', display: 'block', '&:hover': { color: 'white' } }}
                >
                  About Us
                </Typography>
                <Typography 
                  variant="body2" 
                  component="a"
                  href="/services.html"
                  sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', textDecoration: 'none', display: 'block', '&:hover': { color: 'white' } }}
                >
                  Services
                </Typography>
                <Typography 
                  variant="body2" 
                  component="a"
                  href="/contact-us.html"
                  sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', textDecoration: 'none', display: 'block', '&:hover': { color: 'white' } }}
                >
                  Contact Us
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Privacy Policy
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                For Employers
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Post a Job
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Browse Candidates
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  Pricing
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="body2" textAlign="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            © 2026 Apravas | All rights reserved
          </Typography>
        </Container>
      </Box>

      {/* Enquiry Form Dialog */}
      <Dialog
        open={enquiryDialogOpen}
        onClose={() => setEnquiryDialogOpen(false)}
        maxWidth="sm"
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
            Fill your Information
          </Typography>
          <IconButton 
            onClick={() => setEnquiryDialogOpen(false)} 
            size="small"
            sx={{ color: '#666' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Full Name"
              required
              value={enquiryForm.fullName}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, fullName: e.target.value })}
              placeholder="Full Name *"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              required
              value={enquiryForm.email}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
              placeholder="Email Address *"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={enquiryForm.country}
                label="Country"
                onChange={(e) => {
                  const country = e.target.value;
                  const countryCodes = {
                    'India': '+91',
                    'Israel': '+972',
                    'USA': '+1',
                    'UK': '+44',
                  };
                  setEnquiryForm({ 
                    ...enquiryForm, 
                    country,
                    countryCode: countryCodes[country] || '+91'
                  });
                }}
                sx={{
                  borderRadius: '12px',
                }}
              >
                <MenuItem value="India">India</MenuItem>
                <MenuItem value="Israel">Israel</MenuItem>
                <MenuItem value="USA">USA</MenuItem>
                <MenuItem value="UK">UK</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Code</InputLabel>
                <Select
                  value={enquiryForm.countryCode}
                  label="Code"
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, countryCode: e.target.value })}
                  sx={{
                    borderRadius: '12px',
                  }}
                >
                  <MenuItem value="+91">(+91)</MenuItem>
                  <MenuItem value="+972">(+972)</MenuItem>
                  <MenuItem value="+1">(+1)</MenuItem>
                  <MenuItem value="+44">(+44)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Phone Number"
                type="tel"
                value={enquiryForm.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setEnquiryForm({ ...enquiryForm, phone: value });
                }}
                placeholder="Enter 10-digit number"
                inputProps={{ maxLength: 10 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />
            </Box>
            <TextField
              fullWidth
              label="Select City"
              required
              value={enquiryForm.city}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, city: e.target.value })}
              placeholder="Select City *"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Query"
              value={enquiryForm.query}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, query: e.target.value })}
              placeholder="Your Query"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #E0E0E0' }}>
          <Button 
            onClick={() => setEnquiryDialogOpen(false)} 
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              // Validate required fields
              if (!enquiryForm.fullName || !enquiryForm.email || !enquiryForm.city) {
                setEnquirySnackbar({
                  open: true,
                  message: 'Please fill in all required fields',
                  severity: 'error'
                });
                return;
              }
              
              try {
                // Here you can add API call to submit the enquiry
                // For now, just show success message
                setEnquirySnackbar({
                  open: true,
                  message: 'Successfully submitted! Thank you for your enquiry. We will get back to you soon.',
                  severity: 'success'
                });
                setEnquiryDialogOpen(false);
                // Reset form
                setEnquiryForm({
                  fullName: '',
                  email: '',
                  country: 'India',
                  countryCode: '+91',
                  phone: '',
                  city: '',
                  query: '',
                });
              } catch (error) {
                console.error('Error submitting enquiry:', error);
                setEnquirySnackbar({
                  open: true,
                  message: 'Failed to submit enquiry. Please try again.',
                  severity: 'error'
                });
              }
            }}
            variant="contained"
            startIcon={<Send />}
            sx={{
              background: 'linear-gradient(135deg, #7B0FF5 0%, #9D4EDD 100%)',
              color: 'white',
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #9D4EDD 0%, #7B0FF5 100%)',
              },
            }}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enquiry Success Snackbar */}
      <Snackbar
        open={enquirySnackbar.open}
        autoHideDuration={6000}
        onClose={() => setEnquirySnackbar({ ...enquirySnackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setEnquirySnackbar({ ...enquirySnackbar, open: false })} 
          severity={enquirySnackbar.severity}
          sx={{ width: '100%' }}
        >
          {enquirySnackbar.message}
        </Alert>
      </Snackbar>

      {/* Chatbot Component */}
      <IndiaIsraelRecruitmentChatbot
        open={chatbotOpen}
        onClose={(shouldOpen) => {
          setChatbotOpen(shouldOpen === true);
        }}
        initialQuestion={searchQuery || null}
      />
    </Box>
  );
}
