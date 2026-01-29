import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/Layout/MainLayout';
import InterviewAssessmentForm from '../../../components/Interviews/InterviewAssessmentForm';
import { Box, CircularProgress, Alert, Paper, Typography } from '@mui/material';
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </MainLayout>
    );
  }

  if (!applicationId) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Alert severity="error">Application ID is required</Alert>
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
