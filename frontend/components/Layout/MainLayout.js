import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import IndiaIsraelRecruitmentChatbot from '../Chatbot/IndiaIsraelRecruitmentChatbot';

const MainLayout = ({ children }) => {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
      <Footer />
      <IndiaIsraelRecruitmentChatbot
        open={chatbotOpen}
        onClose={(shouldOpen) => setChatbotOpen(shouldOpen === true)}
      />
    </Box>
  );
};

export default MainLayout;
