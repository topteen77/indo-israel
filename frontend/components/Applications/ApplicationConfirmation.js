import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Assignment,
  Phone,
  Email,
  WhatsApp,
  Schedule,
  Info,
  TrackChanges,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

const ApplicationConfirmation = ({ applicationData }) => {
  const router = useRouter();
  const { t } = useTranslation();
  
  const applicationId = applicationData?.id || applicationData?.submissionId || 'N/A';
  const applicantName = applicationData?.fullName || 'Applicant';
  const submittedAt = applicationData?.submittedAt 
    ? new Date(applicationData.submittedAt).toLocaleString()
    : new Date().toLocaleString();

  const getConfirmationMessage = () => {
    return {
      title: "Application Submitted Successfully!",
      message: `Thank you ${applicantName} for registering with Apravas.`,
      applicationId: applicationId,
      timeline: "Our recruitment team will review your profile and contact shortlisted candidates within 7-10 working days.",
      importantNotes: [
        "Submission does not guarantee selection",
        "Keep your phone active for WhatsApp/email communication",
        "Prepare for skill tests/interviews if shortlisted",
        "Ensure passport validity for visa processing",
      ],
      trackingLink: `/dashboard/worker?applicationId=${applicationId}`,
    };
  };

  const confirmation = getConfirmationMessage();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          {/* Success Icon & Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              {confirmation.title}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {confirmation.message}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Application ID Card */}
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
            <Assignment sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              Your Application ID
            </Typography>
            <Chip
              label={confirmation.applicationId}
              sx={{
                fontSize: '1.2rem',
                fontWeight: 700,
                py: 2,
                px: 1,
                bgcolor: 'white',
                color: 'primary.main',
              }}
            />
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
              Submitted on: {submittedAt}
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
              {confirmation.timeline}
            </Typography>
          </Alert>

          {/* Important Notes */}
          <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Info sx={{ mr: 1, color: 'warning.dark' }} />
              <Typography variant="h6" sx={{ color: 'warning.dark' }}>
                Important Notes
              </Typography>
            </Box>
            <List dense>
              {confirmation.importantNotes.map((note, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={note} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Contact Information */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stay Connected
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Phone color="primary" />
                  <Typography variant="body1">
                    <strong>Phone:</strong> +91 11 4747 4700
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Email color="primary" />
                  <Typography variant="body1">
                    <strong>Email:</strong> recruitment@apravas.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WhatsApp color="primary" />
                  <Typography variant="body1">
                    <strong>WhatsApp:</strong> +91 11 4747 4700
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<TrackChanges />}
              onClick={() => router.push(confirmation.trackingLink)}
              sx={{ minWidth: 200 }}
            >
              Track Application
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/')}
              sx={{ minWidth: 200 }}
            >
              Back to Home
            </Button>
          </Box>

          {/* Tracking Link Info */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Track your application status at:{' '}
              <Typography
                component="span"
                variant="body2"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
                onClick={() => router.push(confirmation.trackingLink)}
              >
                apravas.com/track-application
              </Typography>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApplicationConfirmation;
