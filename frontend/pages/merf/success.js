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
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Home,
  Dashboard,
  Business,
} from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

export default function MERFSuccessPage() {
  const router = useRouter();
  const { requisitionId } = router.query;
  const [requisitionData, setRequisitionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady && requisitionId) {
      fetchRequisitionData();
    } else {
      setLoading(false);
    }
  }, [router.isReady, requisitionId]);

  const fetchRequisitionData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/merf/requisitions/${requisitionId}`);
      if (response.data.success) {
        setRequisitionData(response.data.data);
      } else {
        setError('Requisition not found');
      }
    } catch (err) {
      console.error('Error fetching requisition:', err);
      setError('Failed to load requisition data');
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

  const requisition = requisitionData || {};
  const requisitionIdDisplay = requisitionId || requisition.id || 'N/A';
  const requisitionNumber = requisition.requisitionNumber || requisitionIdDisplay;

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {/* Success Icon & Title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                MERF Requisition Submitted Successfully!
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Your requisition is under review
              </Typography>
            </Box>

            {/* Requisition Number Card */}
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
              <Business sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Requisition Number
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  mb: 1,
                }}
              >
                {requisitionNumber}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Status: {requisition.status || 'submitted'}
              </Typography>
            </Paper>

            {/* Compliance Status */}
            {requisition.complianceFlags && requisition.complianceFlags.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Compliance Issues Detected
                </Typography>
                <Typography variant="body2">
                  {requisition.complianceFlags.length} compliance issue(s) found. Please review and address them.
                </Typography>
              </Alert>
            )}

            {requisition.complianceChecked && requisition.complianceFlags?.length === 0 && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600}>
                  ✓ Compliance Check Passed
                </Typography>
              </Alert>
            )}

            {/* Success Message */}
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                Requisition Recorded
              </Typography>
              <Typography variant="body2">
                Your MERF requisition has been successfully submitted and is under review.
                You will be notified once the review is complete.
              </Typography>
            </Alert>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Dashboard />}
                onClick={() => router.push('/dashboard/employer')}
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
