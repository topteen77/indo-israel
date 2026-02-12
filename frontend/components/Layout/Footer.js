import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Box, Typography, Grid, Divider, Stack } from '@mui/material';
import api from '../../utils/api';

/**
 * Reusable site footer: APRAVAS tagline, Jobs, Resources, For Employers, copyright.
 * Post a Job / Browse Candidates redirect to login when not employer, then to employer dashboard.
 */
const Footer = () => {
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

  const linkSx = { color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: 'white' } };
  const linkBlockSx = { ...linkSx, textDecoration: 'none', display: 'block' };

  return (
    <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 6, mt: 8 }}>
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
              {[
                { label: 'Work From Home Jobs', search: 'Work from Home Jobs' },
                { label: 'Part Time Jobs', search: 'Part Time Jobs' },
                { label: 'Jobs for Freshers', search: 'Jobs for Freshers' },
              ].map(({ label, search }) => (
                <Typography
                  key={label}
                  component="a"
                  href={`/jobs?search=${encodeURIComponent(search)}`}
                  variant="body2"
                  sx={linkBlockSx}
                >
                  {label}
                </Typography>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Resources
            </Typography>
            <Stack spacing={1}>
              <Typography component="a" href="/about-us" variant="body2" sx={linkBlockSx}>About Us</Typography>
              <Typography component="a" href="/services" variant="body2" sx={linkBlockSx}>Services</Typography>
              <Typography component="a" href="/contact-us" variant="body2" sx={linkBlockSx}>Contact Us</Typography>
              <Typography variant="body2" sx={linkSx}>Privacy Policy</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              For Employers
            </Typography>
            <Stack spacing={1}>
              <Typography
                variant="body2"
                sx={linkSx}
                onClick={() => {
                  if (mounted && user?.role === 'employer') router.push('/dashboard/employer?openPostJob=true');
                  else router.push('/login?next=' + encodeURIComponent('/dashboard/employer?openPostJob=true'));
                }}
              >
                Post a Job
              </Typography>
              <Typography
                variant="body2"
                sx={linkSx}
                onClick={() => {
                  if (mounted && user?.role === 'employer') router.push('/dashboard/employer?tab=1');
                  else router.push('/login?next=' + encodeURIComponent('/dashboard/employer?tab=1'));
                }}
              >
                Browse Candidates
              </Typography>
              <Typography variant="body2" sx={linkSx}>Pricing</Typography>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4, bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Typography variant="body2" textAlign="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          © 2026 Apravas | All rights reserved
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
