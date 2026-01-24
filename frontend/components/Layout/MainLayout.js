import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  Logout,
  Home,
} from '@mui/icons-material';
import IndiaIsraelRecruitmentChatbot from '../Chatbot/IndiaIsraelRecruitmentChatbot';

const MainLayout = ({ children }) => {
  const router = useRouter();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getDashboardPath = () => {
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'employer') return '/dashboard/employer';
    if (user.role === 'worker') return '/dashboard/worker';
    return '/';
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Apravas Recruitment Platform
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.name || user.fullName || 'User'}
            </Typography>
            <Button
              color="inherit"
              startIcon={<Home />}
              onClick={() => router.push('/')}
            >
              Home
            </Button>
            <Button
              color="inherit"
              startIcon={<Logout />}
              onClick={handleLogout}
            >
              Logout
            </Button>
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
