import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Box, Typography, Button, Stack } from '@mui/material';
import { Home as HomeIcon, Dashboard } from '@mui/icons-material';
import api from '../../utils/api';

/**
 * Reusable site header: logo, Home, About, Service, Contact, Dashboard, Logout (when logged in).
 * Use on home page and inside MainLayout for consistent navigation.
 */
const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    try {
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(localUser?.id ? localUser : null);
      const token = localStorage.getItem('token');
      if (token && localUser?.id) {
        api.get('/auth/me').then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        }).catch(() => {});
      }
    } catch (e) {
      setUser(null);
    }
  }, [router.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const goToDashboard = () => {
    if (mounted && user) {
      if (user.role === 'admin') router.push('/dashboard/admin');
      else if (user.role === 'employer') router.push('/dashboard/employer');
      else if (user.role === 'worker') router.push('/dashboard/worker');
      else router.push('/');
    } else {
      router.push('/login');
    }
  };

  return (
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
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button variant="outlined" startIcon={<HomeIcon />} onClick={() => router.push('/')} sx={{ borderRadius: '25px', px: 3 }}>
              Home
            </Button>
            <Button variant="outlined" onClick={() => router.push('/about-us')} sx={{ borderRadius: '25px', px: 3 }}>
              About
            </Button>
            <Button variant="outlined" onClick={() => router.push('/services')} sx={{ borderRadius: '25px', px: 3 }}>
              Service
            </Button>
            <Button variant="outlined" onClick={() => router.push('/contact-us')} sx={{ borderRadius: '25px', px: 3 }}>
              Contact
            </Button>
            <Button
              variant="outlined"
              startIcon={<Dashboard />}
              onClick={goToDashboard}
              sx={{ borderRadius: '25px', px: 3 }}
            >
              Dashboard
            </Button>
            {mounted && user && (
              <Button variant="outlined" onClick={handleLogout} sx={{ borderRadius: '25px', px: 3 }}>
                Logout
              </Button>
            )}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Header;
