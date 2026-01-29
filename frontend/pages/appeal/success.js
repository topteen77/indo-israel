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
} from '@mui/material';
import {
  CheckCircle,
  Home,
  Dashboard,
  Schedule,
} from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

export default function AppealSuccessPage() {
  const router = useRouter();
  const { appealId, applicationId } = router.query;
  const [appealData, setAppealData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady && appealId) {
      fetchAppealData();
    } else {
      setLoading(false);
    }
  }, [router.isReady, appealId]);

  const fetchAppealData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/appeal/${appealId}`);
      if (response.data.success) {
        setAppealData(response.data.data || response.data);
      } else {
        setError('Appeal not found');
      }
    } catch (err) {
      console.error('Error fetching appeal:', err);
      setError('Failed to load appeal data');
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

  const appeal = appealData || {};
  const appealIdDisplay = appealId || appeal.id || 'N/A';
  const applicationIdDisplay = applicationId || appeal.applicationId || 'N/A';

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {/* Success Icon & Title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Appeal Submitted Successfully!
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Your appeal is under review
              </Typography>
            </Box>

            {/* Appeal ID Card */}
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
              <Typography variant="h6" gutterBottom>
                Your Appeal ID
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  mb: 1,
                }}
              >
                {appealIdDisplay}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Original Application ID: {applicationIdDisplay}
              </Typography>
            </Paper>

            {/* Timeline Information */}
            <Alert
              icon={<Schedule />}
              severity="info"
              sx={{ mb: 3 }}
            >
              <Typography variant="body1" fontWeight={600} gutterBottom>
                Review Timeline
              </Typography>
              <Typography variant="body2">
                Our review team will carefully examine your appeal and respond within <strong>5-7 working days</strong>.
                You will receive an email notification with the decision.
              </Typography>
            </Alert>

            {/* Important Notes */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'info.light' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'info.dark' }}>
                What Happens Next?
              </Typography>
              <Typography variant="body2" component="div" sx={{ color: 'info.dark' }}>
                <ul style={{ marginLeft: '20px', paddingLeft: '10px' }}>
                  <li>Your appeal is being reviewed by our recruitment team</li>
                  <li>We will contact you via email or phone with the decision</li>
                  <li>Keep your phone active for communication</li>
                  <li>You will receive a detailed response within 5-7 working days</li>
                  <li>If additional information is needed, we will contact you</li>
                </ul>
              </Typography>
            </Paper>

            {/* Contact Information */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Need Help?
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                If you have any questions about your appeal, please contact us:
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> recruitment@apravas.com
              </Typography>
              <Typography variant="body2">
                <strong>Phone:</strong> +91 11 4747 4700
              </Typography>
              <Typography variant="body2">
                <strong>WhatsApp:</strong> +91 11 4747 4700
              </Typography>
            </Paper>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Dashboard />}
                onClick={() => router.push('/dashboard/worker')}
                sx={{ minWidth: 200 }}
              >
                View Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Home />}
                onClick={() => router.push('/')}
                sx={{ minWidth: 200 }}
              >
                Back to Home
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </MainLayout>
  );
}
