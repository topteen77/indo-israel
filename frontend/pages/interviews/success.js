import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Home,
  Dashboard,
  Assessment,
} from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

export default function InterviewSuccessPage() {
  const router = useRouter();
  const { assessmentId, applicationId } = router.query;
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady && assessmentId) {
      fetchAssessmentData();
    } else {
      setLoading(false);
    }
  }, [router.isReady, assessmentId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/interviews/assessment/${assessmentId}`);
      if (response.data.success) {
        setAssessmentData(response.data.data || response.data);
      } else {
        setError('Assessment not found');
      }
    } catch (err) {
      console.error('Error fetching assessment:', err);
      setError('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
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
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            startIcon={<Home />}
            onClick={() => router.push('/')}
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        </Container>
      </MainLayout>
    );
  }

  const assessment = assessmentData || {};
  const assessmentIdDisplay = assessmentId || assessment.id || 'N/A';
  const totalScore = assessment.totalScore || 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 70) return 'info';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getRecommendationLabel = (rec) => {
    const labels = {
      strongly_recommend: 'Strongly Recommend',
      recommend: 'Recommend',
      consider: 'Consider',
      not_recommend: 'Not Recommend',
    };
    return labels[rec] || rec;
  };

  const getRecommendationColor = (rec) => {
    const colors = {
      strongly_recommend: 'success',
      recommend: 'info',
      consider: 'warning',
      not_recommend: 'error',
    };
    return colors[rec] || 'default';
  };

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {/* Success Icon & Title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Assessment Submitted Successfully!
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Interview assessment has been recorded
              </Typography>
            </Box>

            {/* Assessment ID Card */}
            <Paper
              elevation={2}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                textAlign: 'center',
              }}
            >
              <Assessment sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Assessment ID
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  mb: 1,
                }}
              >
                {assessmentIdDisplay}
              </Typography>
              {applicationId && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Application ID: {applicationId}
                </Typography>
              )}
            </Paper>

            {/* Score Display */}
            {totalScore > 0 && (
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: `${getScoreColor(totalScore)}.light`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Total Score
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    color: `${getScoreColor(totalScore)}.main`,
                  }}
                >
                  {totalScore} / 100
                </Typography>
                {assessment.recommendation && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Recommendation: {getRecommendationLabel(assessment.recommendation)}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}

            {/* Success Message */}
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                Assessment Recorded
              </Typography>
              <Typography variant="body2">
                The interview assessment has been successfully submitted and recorded in the system.
                The application status will be updated based on the assessment results.
              </Typography>
            </Alert>

            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {applicationId && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Assessment />}
                  onClick={() => router.push(`/applications/${applicationId}`)}
                  sx={{ minWidth: 200 }}
                >
                  View Application
                </Button>
              )}
              <Button
                variant="contained"
                size="large"
                startIcon={<Dashboard />}
                onClick={() => {
                  const user = JSON.parse(localStorage.getItem('user') || '{}');
                  if (user.role === 'employer') {
                    router.push('/dashboard/employer');
                  } else if (user.role === 'admin') {
                    router.push('/dashboard/admin');
                  } else {
                    router.push('/dashboard/worker');
                  }
                }}
                sx={{ minWidth: 200 }}
              >
                Back to Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Home />}
                onClick={() => router.push('/')}
                sx={{ minWidth: 200 }}
              >
                Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </MainLayout>
  );
}
