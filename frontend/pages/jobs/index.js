import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Container, Typography, Card, CardContent, Grid,
  Chip, Button, Paper, Divider, LinearProgress, Alert
} from '@mui/material';
import {
  Work, LocationOn, AttachMoney, AccessTime, Business,
  ArrowBack, Send
} from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

export default function JobsPage() {
  const router = useRouter();
  const { category, search } = router.query;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('All Jobs');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      loadJobs();
    }
  }, [router.isReady, category, search]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      
      if (category) {
        response = await api.get(`/jobs/category/${encodeURIComponent(category)}`);
        setPageTitle(`${category} Jobs`);
      } else if (search) {
        response = await api.get(`/jobs/search/${encodeURIComponent(search)}`);
        setPageTitle(`Jobs: ${search}`);
      } else {
        response = await api.get('/jobs/all');
        setPageTitle('All Jobs');
      }

      if (response.data.success) {
        setJobs(response.data.data.jobs || []);
      } else {
        setError(response.data.message || 'Failed to load jobs');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Failed to connect to server. Please check if the backend is running.';
      setError(errorMessage);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (jobId) => {
    // Navigate to application form
    router.push(`/apply?jobId=${jobId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ py: 4 }}>
          <Container>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Loading jobs...</Typography>
          </Container>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ py: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Container>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => router.push('/')}
              sx={{ mb: 2 }}
            >
              Back to Home
            </Button>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {pageTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Error loading jobs
              </Typography>
              <Typography variant="body2">{error}</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={loadJobs}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Alert>
          )}

          {/* Jobs List */}
          {!error && jobs.length > 0 ? (
            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Grid item xs={12} key={job.id}>
                  <Card
                    sx={{
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                          <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 2,
                                bgcolor: 'primary.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Work sx={{ fontSize: 28, color: 'primary.main' }} />
                            </Box>
                            <Box flex={1}>
                              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                {job.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {job.company}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {job.location}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                <Chip
                                  icon={<AttachMoney />}
                                  label={job.salary}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                                <Chip
                                  icon={<AccessTime />}
                                  label={job.experience}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={job.type}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={`${job.openings} openings`}
                                  size="small"
                                  color="info"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {job.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Posted {job.posted}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', justifyContent: 'center' }}>
                            <Button
                              variant="contained"
                              fullWidth
                              size="large"
                              startIcon={<Send />}
                              onClick={() => handleApply(job.id)}
                              sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                py: 1.5,
                              }}
                            >
                              Apply Now
                            </Button>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => router.push(`/jobs/${job.id}`)}
                            >
                              View Details
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : !error ? (
            <Alert severity="info">
              No jobs found. Please try a different search or category.
            </Alert>
          ) : null}
        </Container>
      </Box>
    </MainLayout>
  );
}
