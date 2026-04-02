import React, { useState } from 'react';
import { Box } from '@mui/material';
import IndiaIsraelRecruitmentChatbot from '../Chatbot/IndiaIsraelRecruitmentChatbot';

/** Minimal wrapper for dashboard routes: no marketing header/footer, chatbot preserved. */
export default function DashboardPageFrame({ children }) {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {children}
      <IndiaIsraelRecruitmentChatbot
        open={chatbotOpen}
        onClose={(shouldOpen) => setChatbotOpen(shouldOpen === true)}
      />
    </Box>
  );
}
