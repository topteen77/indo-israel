import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Container, Typography, Card, CardContent, Grid,
  Chip, Button, Paper, Divider, LinearProgress, Alert,
  List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Work, LocationOn, AttachMoney, AccessTime, Business,
  ArrowBack, Send, CheckCircle, People, Category
} from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

export default function JobDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/jobs/${id}`);
      
      if (response.data.success) {
        setJob(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load job details');
      }
    } catch (error) {
      console.error('Error loading job:', error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Failed to load job details. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    router.push(`/apply?jobId=${id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ py: 4 }}>
          <Container>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Loading job details...</Typography>
          </Container>
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ py: 4 }}>
          <Container>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Error loading job
              </Typography>
              <Typography variant="body2">{error}</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={loadJob}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Alert>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/jobs')}
            >
              Back to Jobs
            </Button>
          </Container>
        </Box>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <Box sx={{ py: 4 }}>
          <Container>
            <Alert severity="info">
              Job not found.
            </Alert>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/jobs')}
              sx={{ mt: 2 }}
            >
              Back to Jobs
            </Button>
          </Container>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ py: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Container>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            sx={{ mb: 3 }}
          >
            Back
          </Button>

          <Grid container spacing={3}>
            {/* Main Job Details */}
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  {/* Job Title and Company */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Work sx={{ fontSize: 32, color: 'primary.main' }} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                          {job.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Business sx={{ fontSize: 20, color: 'text.secondary' }} />
                            <Typography variant="h6" color="text.secondary">
                              {job.company}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 20, color: 'text.secondary' }} />
                            <Typography variant="body1" color="text.secondary">
                              {job.location}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<Category />}
                            label={job.category}
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            icon={<AccessTime />}
                            label={job.type || 'Full-time'}
                            variant="outlined"
                          />
                          {job.openings && (
                            <Chip
                              icon={<People />}
                              label={`${job.openings} opening${job.openings > 1 ? 's' : ''}`}
                              color="info"
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Job Details */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Job Details
                    </Typography>
                    <Grid container spacing={2}>
                      {job.salary && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoney sx={{ color: 'success.main' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Salary
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {job.salary}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}
                      {job.experience && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ color: 'primary.main' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Experience Required
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {job.experience}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Job Description */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Job Description
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {job.description}
                    </Typography>
                  </Box>

                  {/* Requirements */}
                  {job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0 && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Requirements
                        </Typography>
                        <List>
                          {job.requirements.map((requirement, index) => (
                            <ListItem key={index} sx={{ pl: 0 }}>
                              <ListItemIcon>
                                <CheckCircle color="success" sx={{ fontSize: 20 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={requirement}
                                primaryTypographyProps={{ variant: 'body1' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar - Apply Section */}
            <Grid item xs={12} md={4}>
              <Card sx={{ position: 'sticky', top: 20 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Apply for this Job
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Send />}
                    onClick={handleApply}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      py: 1.5,
                      mb: 2,
                    }}
                  >
                    Apply Now
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => router.push('/jobs')}
                  >
                    Browse More Jobs
                  </Button>
                  
                  <Divider sx={{ my: 3 }} />

                  {/* Quick Info */}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Job Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Category:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {job.category}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Job Type:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {job.type || 'Full-time'}
                        </Typography>
                      </Box>
                      {job.openings && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Openings:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {job.openings}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </MainLayout>
  );
}
