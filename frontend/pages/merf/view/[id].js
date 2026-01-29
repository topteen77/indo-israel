import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import MainLayout from '../../../components/Layout/MainLayout';
import api from '../../../utils/api';

export default function MERFViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [requisition, setRequisition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady && id) {
      fetchRequisition();
    }
  }, [router.isReady, id]);

  const fetchRequisition = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/merf/requisitions/${id}`);
      if (response.data.success) {
        setRequisition(response.data.data);
      } else {
        setError('Requisition not found');
      }
    } catch (err) {
      console.error('Error fetching requisition:', err);
      setError('Failed to load requisition');
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

  if (error || !requisition) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">{error || 'Requisition not found'}</Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/merf')}
            sx={{ mt: 2 }}
          >
            Back to MERF List
          </Button>
        </Container>
      </MainLayout>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'info',
      under_review: 'warning',
      approved: 'success',
      rejected: 'error',
      active: 'success',
      completed: 'info',
    };
    return colors[status] || 'default';
  };

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/merf')}
          >
            Back to List
          </Button>
          {requisition.status === 'draft' && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => router.push(`/merf/edit/${id}`)}
            >
              Edit
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Header Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {requisition.title}
                    </Typography>
                    {requisition.titleHe && (
                      <Typography variant="h6" color="text.secondary" dir="rtl">
                        {requisition.titleHe}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Requisition Number: <strong>{requisition.requisitionNumber}</strong>
                    </Typography>
                  </Box>
                  <Chip
                    label={requisition.status}
                    color={getStatusColor(requisition.status)}
                    size="medium"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Compliance Flags */}
          {requisition.complianceFlags && requisition.complianceFlags.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>
                  Compliance Issues Detected
                </Typography>
                {requisition.complianceFlags.map((flag, index) => (
                  <Typography key={index} variant="body2">
                    • {flag.message}
                  </Typography>
                ))}
              </Alert>
            </Grid>
          )}

          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Job Category"
                      secondary={requisition.jobCategory}
                    />
                  </ListItem>
                  {requisition.specificTrade && (
                    <ListItem>
                      <ListItemText
                        primary="Specific Trade"
                        secondary={requisition.specificTrade}
                      />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemText
                      primary="Number of Workers"
                      secondary={requisition.numberOfWorkers}
                    />
                  </ListItem>
                  {requisition.experienceRequired && (
                    <ListItem>
                      <ListItemText
                        primary="Experience Required"
                        secondary={requisition.experienceRequired}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Job Details */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Job Details
                </Typography>
                <List>
                  {requisition.salaryRange && (
                    <ListItem>
                      <ListItemText
                        primary="Salary Range"
                        secondary={`${requisition.salaryRange} ILS`}
                      />
                    </ListItem>
                  )}
                  {requisition.contractDuration && (
                    <ListItem>
                      <ListItemText
                        primary="Contract Duration"
                        secondary={requisition.contractDuration}
                      />
                    </ListItem>
                  )}
                  {requisition.startDate && (
                    <ListItem>
                      <ListItemText
                        primary="Expected Start Date"
                        secondary={new Date(requisition.startDate).toLocaleDateString()}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {requisition.description}
                </Typography>
                {requisition.descriptionHe && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1" dir="rtl">
                      {requisition.descriptionHe}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Qualifications & Languages */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Required Qualifications
                </Typography>
                {requisition.qualifications && requisition.qualifications.length > 0 ? (
                  <List>
                    {requisition.qualifications.map((qual, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={qual} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific qualifications listed
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Languages Required
                </Typography>
                {requisition.languagesRequired && requisition.languagesRequired.length > 0 ? (
                  <List>
                    {requisition.languagesRequired.map((lang, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={lang} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific languages required
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Work Location */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Work Location
                </Typography>
                <Typography variant="body1">
                  {requisition.workLocation}
                </Typography>
                {requisition.workLocationHe && (
                  <Typography variant="body1" dir="rtl" sx={{ mt: 1 }}>
                    {requisition.workLocationHe}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Benefits */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Benefits & Conditions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Chip
                      label={requisition.accommodationProvided ? 'Accommodation Provided' : 'No Accommodation'}
                      color={requisition.accommodationProvided ? 'success' : 'default'}
                      sx={{ mb: 1 }}
                    />
                    {requisition.accommodationDetails && (
                      <Typography variant="body2" color="text.secondary">
                        {requisition.accommodationDetails}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Chip
                      label={requisition.transportationProvided ? 'Transportation Provided' : 'No Transportation'}
                      color={requisition.transportationProvided ? 'success' : 'default'}
                    />
                  </Grid>
                  {requisition.otherBenefits && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Other Benefits: {requisition.otherBenefits}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Timestamps */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Timeline
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Created"
                      secondary={new Date(requisition.createdAt).toLocaleString()}
                    />
                  </ListItem>
                  {requisition.submittedAt && (
                    <ListItem>
                      <ListItemText
                        primary="Submitted"
                        secondary={new Date(requisition.submittedAt).toLocaleString()}
                      />
                    </ListItem>
                  )}
                  {requisition.approvedAt && (
                    <ListItem>
                      <ListItemText
                        primary="Approved"
                        secondary={new Date(requisition.approvedAt).toLocaleString()}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
}
