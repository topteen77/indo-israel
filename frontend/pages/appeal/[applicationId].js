import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import {
  Gavel,
  ArrowBack,
  Send,
  Info,
  Assignment,
} from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

export default function AppealPage() {
  const router = useRouter();
  const { applicationId } = router.query;
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    additionalInfo: '',
    supportingDocuments: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (router.isReady && applicationId) {
      fetchApplicationData();
    }
  }, [router.isReady, applicationId]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/israel-skilled-worker/${applicationId}`);
      if (response.data.success) {
        setApplicationData(response.data.data || response.data);
      } else {
        setError('Application not found');
      }
    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for your appeal';
    }
    if (formData.reason.trim().length < 50) {
      errors.reason = 'Please provide a detailed reason (at least 50 characters)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const appealData = {
        applicationId,
        reason: formData.reason,
        additionalInfo: formData.additionalInfo,
        supportingDocuments: formData.supportingDocuments,
        submittedAt: new Date().toISOString(),
      };

      const response = await api.post('/applications/appeal', appealData);

      if (response.data.success) {
        setSubmitted(true);
      } else {
        setError(response.data.message || 'Failed to submit appeal');
      }
    } catch (err) {
      console.error('Error submitting appeal:', err);
      setError(err.response?.data?.message || 'Failed to submit appeal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
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

  if (error && !applicationData) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/dashboard/worker')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Container>
      </MainLayout>
    );
  }

  if (submitted) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Card elevation={3}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <Gavel sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                  Appeal Submitted Successfully!
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Your appeal is under review
                </Typography>
              </Box>

              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  What&apos;s Next?
                </Typography>
                <Typography variant="body2">
                  Our review team will carefully examine your appeal and respond within <strong>5-7 working days</strong>.
                  You will receive an email notification with the decision.
                </Typography>
              </Alert>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push('/dashboard/worker')}
                  sx={{ mr: 2 }}
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => router.push('/')}
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

  const application = applicationData || {};
  const appealDeadline = application.rejectedAt
    ? new Date(new Date(application.rejectedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
    : 'N/A';

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 3 }}
        >
          Back
        </Button>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Gavel sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Submit an Appeal
              </Typography>
              <Typography variant="body1" color="text.secondary">
                If you believe there was an error in the review process, you can submit an appeal
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Application Info */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Application Information</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Application ID
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {application.id || application.submissionId || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Applicant Name
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {application.fullName || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Job Category
                  </Typography>
                  <Typography variant="body1">
                    {application.jobCategory || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Appeal Deadline
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="warning.main">
                    {appealDeadline}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Info Alert */}
            <Alert icon={<Info />} severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Appeals must be submitted within 7 days of receiving the rejection notification.
                Please provide detailed information about why you believe the decision should be reconsidered.
              </Typography>
            </Alert>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Appeal Form */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Reason for Appeal *"
                multiline
                rows={6}
                value={formData.reason}
                onChange={handleChange('reason')}
                error={!!formErrors.reason}
                helperText={formErrors.reason || 'Please explain why you believe the decision should be reconsidered (minimum 50 characters)'}
                required
                sx={{ mb: 3 }}
                placeholder="Example: I believe there was an error because... [Provide detailed explanation]"
              />

              <TextField
                fullWidth
                label="Additional Information"
                multiline
                rows={4}
                value={formData.additionalInfo}
                onChange={handleChange('additionalInfo')}
                sx={{ mb: 3 }}
                placeholder="Any additional information that supports your appeal (optional)"
              />

              <TextField
                fullWidth
                label="Supporting Documents or References"
                multiline
                rows={3}
                value={formData.supportingDocuments}
                onChange={handleChange('supportingDocuments')}
                sx={{ mb: 3 }}
                placeholder="List any supporting documents, certificates, or references that support your appeal (optional)"
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                  disabled={submitting}
                  size="large"
                >
                  {submitting ? 'Submitting...' : 'Submit Appeal'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </MainLayout>
  );
}
