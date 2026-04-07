import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import IndiaIsraelRecruitmentChatbot from '../Chatbot/IndiaIsraelRecruitmentChatbot';

/** Minimal wrapper for dashboard routes: no marketing header/footer, chatbot preserved. */
export default function DashboardPageFrame({ children }) {
  const router = useRouter();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const hideChatbot =
    router.isReady && router.pathname.startsWith('/dashboard/employer');

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {children}
      {!hideChatbot && (
        <IndiaIsraelRecruitmentChatbot
          open={chatbotOpen}
          onClose={(shouldOpen) => setChatbotOpen(shouldOpen === true)}
        />
      )}
    </Box>
  );
}
