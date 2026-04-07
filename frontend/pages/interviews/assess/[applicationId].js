import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/Layout/MainLayout';
import InterviewAssessmentForm from '../../../components/Interviews/InterviewAssessmentForm';
import { Box, CircularProgress, Alert, Typography, Stack, Paper, Skeleton } from '@mui/material';
import api from '../../../utils/api';

export default function InterviewAssessmentPage() {
  const router = useRouter();
  const { applicationId } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interviewerId, setInterviewerId] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      // Get current user (interviewer) from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        setInterviewerId(user.id);
      } else {
        setError('Interviewer information not found. Please log in.');
      }
      setLoading(false);
    }
  }, [router.isReady]);

  const handleSuccess = (assessmentData) => {
    router.push(`/interviews/success?assessmentId=${assessmentData.id}&applicationId=${applicationId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 520, mx: 'auto', py: 6 }}>
          <Stack spacing={3} alignItems="center">
            <CircularProgress size={48} thickness={4} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Preparing assessment…
            </Typography>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, width: 1 }}>
              <Skeleton width="60%" height={24} sx={{ mb: 1 }} />
              <Skeleton width="90%" />
            </Paper>
          </Stack>
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 480, mx: 'auto', py: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  if (!applicationId) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 480, mx: 'auto', py: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Application ID is required
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <InterviewAssessmentForm
        applicationId={applicationId}
        interviewerId={interviewerId}
        onSuccess={handleSuccess}
      />
    </MainLayout>
  );
}
