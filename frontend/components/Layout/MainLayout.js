import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { Logout, Home, Login } from '@mui/icons-material';
import IndiaIsraelRecruitmentChatbot from '../Chatbot/IndiaIsraelRecruitmentChatbot';
import api from '../../utils/api';

const MainLayout = ({ children }) => {
  const router = useRouter();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [user, setUser] = useState({});
  const [mounted, setMounted] = useState(false);
  const [navLoginLabel, setNavLoginLabel] = useState('Login');

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    try {
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(localUser);
      if (token) {
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.user) {
              setUser(res.data.user);
              localStorage.setItem('user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            if (!localUser?.id) setUser({});
          });
      }
      api.get('/auth/login-credentials')
        .then((res) => {
          if (res.data?.navLoginLabel) setNavLoginLabel(res.data.navLoginLabel);
        })
        .catch(() => {});
    } catch (e) {
      console.error('Error loading user:', e);
      setUser({});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Apravas Recruitment Platform
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Button color="inherit" startIcon={<Home />} onClick={() => router.push('/')}>
              Home
            </Button>
            {mounted && (user?.id || localStorage.getItem('token')) ? (
              <Button color="inherit" startIcon={<Logout />} onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Button color="inherit" startIcon={<Login />} onClick={() => router.push('/login')}>
                {navLoginLabel}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
      
      {/* Chatbot Component */}
      <IndiaIsraelRecruitmentChatbot 
        open={chatbotOpen} 
        onClose={(shouldOpen) => {
          // If shouldOpen is true, open it; if false, close it
          setChatbotOpen(shouldOpen === true);
        }} 
      />
    </Box>
  );
};

export default MainLayout;
