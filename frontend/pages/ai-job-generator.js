import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import AIJobGenerator from '../components/AI/AIJobGenerator';
import { Box, Container, Typography, Paper } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';

export default function AIJobGeneratorPage() {
  const handleGenerated = (jobData) => {
    console.log('Generated Job Data:', jobData);
    // You can add navigation or notification here
  };

  const handleClose = () => {
    // Navigate back or to dashboard
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <MainLayout>
      <Box sx={{ py: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Container maxWidth="lg">
          <Paper 
            elevation={3}
            sx={{ 
              p: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              mb: 4
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <AutoAwesome sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  AI Job Post Generator
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Generate professional job postings with AI-powered compliance engine
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <AIJobGenerator 
              onGenerated={handleGenerated}
              onClose={handleClose}
            />
          </Paper>
        </Container>
      </Box>
    </MainLayout>
  );
}
