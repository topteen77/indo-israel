import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Container, Typography, Card, CardContent, Grid,
  Chip, Button, Paper, Divider, LinearProgress, Alert
} from '@mui/material';
import {
  Work, LocationOn, AttachMoney, AccessTime, Business,
  ArrowBack, Send, Category
} from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

export default function JobsPage() {
  const router = useRouter();
  const { category, search, industry } = router.query;
  const [jobs, setJobs] = useState([]);
  const [jobsByIndustry, setJobsByIndustry] = useState({});
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('All Jobs');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      loadJobs();
    }
  }, [router.isReady, category, search, industry]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      
      if (industry) {
        // Filter by industry - use dedicated industry endpoint for better performance
        const decodedIndustry = decodeURIComponent(industry);
        response = await api.get(`/jobs/industry/${encodeURIComponent(decodedIndustry)}`);
        setPageTitle(`${decodedIndustry} Jobs`);
      } else if (category) {
        response = await api.get(`/jobs/category/${encodeURIComponent(category)}`);
        setPageTitle(`${category} Jobs`);
      } else if (search) {
        response = await api.get(`/jobs/search/${encodeURIComponent(search)}`);
        setPageTitle(`Jobs: ${search}`);
      } else {
        // Request jobs grouped by industry
        response = await api.get('/jobs/all?groupByIndustry=true');
        setPageTitle('All Jobs');
      }

      if (response.data.success) {
        if (response.data.data.groupedByIndustry) {
          // Jobs grouped by industry (when no specific industry filter)
          setJobsByIndustry(response.data.data.groupedByIndustry);
          setJobs([]); // Clear flat list
        } else if (response.data.data.jobs) {
          // Regular flat list (from industry endpoint or other endpoints)
          setJobs(response.data.data.jobs || []);
          setJobsByIndustry({}); // Clear grouped list
        } else {
          // No jobs found
          setJobs([]);
          setJobsByIndustry({});
        }
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
      setJobsByIndustry({});
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
              {Object.keys(jobsByIndustry).length > 0 
                ? Object.values(jobsByIndustry).reduce((sum, jobs) => sum + jobs.length, 0)
                : jobs.length} job{(Object.keys(jobsByIndustry).length > 0 
                ? Object.values(jobsByIndustry).reduce((sum, jobs) => sum + jobs.length, 0)
                : jobs.length) !== 1 ? 's' : ''} found
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

          {/* Jobs List - Grouped by Industry */}
          {!error && Object.keys(jobsByIndustry).length > 0 ? (
            Object.entries(jobsByIndustry).map(([industry, industryJobs]) => (
              <Box key={industry} sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Category sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {industry}
                  </Typography>
                  <Chip 
                    label={`${industryJobs.length} job${industryJobs.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 2 }}
                  />
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  {industryJobs.map((job) => (
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
                                    {job.contractLength && (
                                      <Chip
                                        label={job.contractLength}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                      />
                                    )}
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
                                    {job.postedDate ? `Posted ${job.postedDate}` : `Posted ${new Date(job.createdAt).toLocaleDateString()}`}
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
              </Box>
            ))
          ) : !error && jobs.length > 0 ? (
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
