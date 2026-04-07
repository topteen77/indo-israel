import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Rating,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Divider,
  Chip,
  Paper,
  LinearProgress,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  Stack,
  Avatar,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  Person,
  Work,
  Assessment,
  Send,
  ArrowBack,
  CheckCircle,
  Star,
  VideoCall,
  Psychology,
  RecordVoiceOver,
  Lightbulb,
  Notes,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import api from '../../utils/api';

const sectionCardSx = {
  mb: 3,
  borderRadius: 2,
  borderColor: 'divider',
  boxShadow: '0 2px 14px rgba(15, 23, 42, 0.06)',
  overflow: 'visible',
};

const InterviewAssessmentForm = ({ applicationId, interviewerId, onSuccess }) => {
  const router = useRouter();
  const theme = useTheme();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [recommendation, setRecommendation] = useState('');

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      // Technical Skills (0-30 points)
      technicalKnowledge: 0,
      technicalKnowledgeNotes: '',
      
      // Experience & Qualifications (0-25 points)
      experienceRelevance: 0,
      experienceRelevanceNotes: '',
      qualifications: 0,
      qualificationsNotes: '',
      
      // Communication Skills (0-20 points)
      communicationSkills: 0,
      communicationSkillsNotes: '',
      languageProficiency: 0,
      languageProficiencyNotes: '',
      
      // Problem Solving & Adaptability (0-15 points)
      problemSolving: 0,
      problemSolvingNotes: '',
      adaptability: 0,
      adaptabilityNotes: '',
      
      // Overall Assessment
      overallImpression: 0,
      overallImpressionNotes: '',
      
      // Recommendation
      recommendation: '',
      recommendationNotes: '',
      
      // Interview Details
      interviewDate: new Date().toISOString().split('T')[0],
      interviewDuration: '',
      interviewType: 'video', // video, phone, in-person
      interviewLocation: '',
      
      // Additional Notes
      strengths: '',
      weaknesses: '',
      additionalNotes: '',
    },
  });

  // Watch all score fields to calculate total
  const watchedScores = watch([
    'technicalKnowledge',
    'experienceRelevance',
    'qualifications',
    'communicationSkills',
    'languageProficiency',
    'problemSolving',
    'adaptability',
    'overallImpression',
  ]);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
    } else {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    // Calculate total score
    const scores = watchedScores.map(score => Number(score) || 0);
    const total = scores.reduce((sum, score) => sum + score, 0);
    setTotalScore(total);
    
    // Determine recommendation based on score
    if (total >= 80) {
      setRecommendation('strongly_recommend');
    } else if (total >= 70) {
      setRecommendation('recommend');
    } else if (total >= 60) {
      setRecommendation('consider');
    } else {
      setRecommendation('not_recommend');
    }
    
    // Auto-set recommendation if not manually set
    if (!watch('recommendation')) {
      setValue('recommendation', recommendation);
    }
  }, [watchedScores, recommendation, watch, setValue]);

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

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);

      const assessmentData = {
        applicationId,
        interviewerId,
        ...data,
        totalScore,
        recommendation: data.recommendation || recommendation,
        submittedAt: new Date().toISOString(),
      };

      const response = await api.post('/interviews/assessment', assessmentData);

      if (response.data.success) {
        if (onSuccess) {
          onSuccess(response.data.data);
        } else {
          router.push(`/interviews/success?assessmentId=${response.data.data.id}`);
        }
      } else {
        setError(response.data.message || 'Failed to submit assessment');
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError(err.response?.data?.message || 'Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <Box sx={{ width: 1, maxWidth: 1200, mx: 'auto', py: 2 }}>
        <Stack spacing={3} alignItems="center" sx={{ minHeight: '50vh', justifyContent: 'center' }}>
          <CircularProgress size={48} thickness={4} sx={{ color: 'primary.main' }} />
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Loading application and assessment form…
          </Typography>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, width: 1, maxWidth: 480 }}>
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" height={28} width="55%" />
              <Skeleton variant="rounded" height={20} width="85%" />
              <Skeleton variant="rounded" height={20} width="70%" />
            </Stack>
          </Paper>
        </Stack>
      </Box>
    );
  }

  if (error && !applicationData) {
    return (
      <Box sx={{ width: 1, maxWidth: 560, mx: 'auto', py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Assessment sx={{ fontSize: 48, color: 'error.main', mb: 2, opacity: 0.9 }} />
          <Alert severity="error" sx={{ textAlign: 'left', mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ textTransform: 'none' }}>
            Go back
          </Button>
        </Paper>
      </Box>
    );
  }

  const application = applicationData || {};
  const scoreKey = getScoreColor(totalScore);
  const scoreMain = theme.palette[scoreKey]?.main || theme.palette.primary.main;
  const scoreBg = alpha(scoreMain, 0.12);

  return (
    <Box sx={{ width: 1, maxWidth: 1200, mx: 'auto', pb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.back()}
        sx={{ mb: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
      >
        Back
      </Button>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          mb: 3,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark ?? theme.palette.primary.main} 0%, #4C1D95 42%, #7B0FF5 100%)`,
          color: 'common.white',
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        <Stack spacing={2}>
          <Chip
            label={`Application #${applicationId}`}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              bgcolor: alpha('#fff', 0.12),
              color: 'common.white',
              fontWeight: 600,
              border: '1px solid',
              borderColor: alpha('#fff', 0.28),
            }}
          />
          <Typography variant="h4" component="h1" fontWeight={800} sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Interview assessment
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 640, lineHeight: 1.65 }}>
            Rate each area with the stars below. Points total 100; the score and suggested recommendation update as you go.
          </Typography>
          {(application.fullName || application.email) && (
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ pt: 0.5 }}>
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: alpha('#fff', 0.2),
                  color: 'common.white',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                }}
              >
                {(application.fullName || application.email || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={700} variant="h6" sx={{ fontSize: '1.1rem' }}>
                  {application.fullName || 'Candidate'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.88 }}>
                  {[application.jobCategory, application.specificTrade].filter(Boolean).join(' · ') || 'Applicant'}
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} lg={4}>
          <Stack
            spacing={2.5}
            sx={{
              position: { lg: 'sticky' },
              top: { lg: 24 },
            }}
          >
            <Card variant="outlined" sx={{ ...sectionCardSx, mb: 0 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                    <Person />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Candidate details
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.04 }}>
                      Name
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {application.fullName || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.04 }}>
                      Role / trade
                    </Typography>
                    <Typography variant="body2">
                      {[application.jobCategory, application.specificTrade].filter(Boolean).join(' · ') || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.04 }}>
                      Experience
                    </Typography>
                    <Typography variant="body2">
                      {application.experienceYears != null && application.experienceYears !== ''
                        ? `${application.experienceYears} years`
                        : '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.04 }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {application.email || '—'}
                    </Typography>
                  </Box>
                  {(application.mobileNumber || application.phone) && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.04 }}>
                        Phone
                      </Typography>
                      <Typography variant="body2">{application.mobileNumber || application.phone}</Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
                bgcolor: scoreBg,
              }}
            >
              <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.08 }}>
                Running total
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: scoreMain,
                  letterSpacing: '-0.03em',
                  my: 1,
                }}
              >
                {totalScore}
                <Typography component="span" variant="h5" color="text.secondary" fontWeight={600}>
                  {' '}
                  / 100
                </Typography>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, totalScore)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: alpha(scoreMain, 0.2),
                  '& .MuiLinearProgress-bar': { borderRadius: 5 },
                }}
                color={scoreKey}
              />
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={getRecommendationLabel(recommendation)}
                  color={getRecommendationColor(recommendation)}
                  size="medium"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Interview Details */}
            <Card variant="outlined" sx={sectionCardSx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <VideoCall sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Interview details
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    When and how the interview took place
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="interviewDate"
                      control={control}
                      rules={{ required: 'Interview date is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Interview Date"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          error={!!errors.interviewDate}
                          helperText={errors.interviewDate?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="interviewDuration"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Duration (minutes)"
                          type="number"
                          fullWidth
                          inputProps={{ min: 0 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="interviewType"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Interview Type</InputLabel>
                          <Select {...field} label="Interview Type">
                            <MenuItem value="video">Video Call</MenuItem>
                            <MenuItem value="phone">Phone Call</MenuItem>
                            <MenuItem value="in-person">In-Person</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="interviewLocation"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Location / Platform"
                          fullWidth
                          placeholder="e.g., Zoom, Google Meet, Office Address"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Technical Skills Section */}
            <Card variant="outlined" sx={sectionCardSx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <Psychology sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Technical skills & knowledge
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Up to 30 points
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Box sx={{ mb: 0 }}>
                  <FormLabel component="legend">Technical Knowledge</FormLabel>
                  <Controller
                    name="technicalKnowledge"
                    control={control}
                    rules={{ required: 'Please rate technical knowledge', min: { value: 0, message: 'Score must be 0-30' }, max: { value: 30, message: 'Score must be 0-30' } }}
                    render={({ field }) => (
                      <Box>
                        <Rating
                          {...field}
                          max={6}
                          value={field.value / 5}
                          onChange={(e, newValue) => field.onChange(newValue * 5)}
                          sx={{ fontSize: 36, mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Score: {field.value} / 30
                        </Typography>
                        <Controller
                          name="technicalKnowledgeNotes"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              multiline
                              rows={2}
                              placeholder="Notes on technical knowledge..."
                              sx={{ mt: 2 }}
                            />
                          )}
                        />
                      </Box>
                    )}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Experience & Qualifications Section */}
            <Card variant="outlined" sx={sectionCardSx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <Work sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Experience & qualifications
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Up to 25 points
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormLabel component="legend">Experience Relevance</FormLabel>
                    <Controller
                      name="experienceRelevance"
                      control={control}
                      rules={{ required: 'Please rate experience relevance', min: 0, max: 15 }}
                      render={({ field }) => (
                        <Box>
                          <Rating
                            {...field}
                            max={5}
                            value={field.value / 3}
                            onChange={(e, newValue) => field.onChange(newValue * 3)}
                            sx={{ fontSize: 40, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Score: {field.value} / 15
                          </Typography>
                          <Controller
                            name="experienceRelevanceNotes"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Notes on experience..."
                                sx={{ mt: 2 }}
                              />
                            )}
                          />
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormLabel component="legend">Qualifications</FormLabel>
                    <Controller
                      name="qualifications"
                      control={control}
                      rules={{ required: 'Please rate qualifications', min: 0, max: 10 }}
                      render={({ field }) => (
                        <Box>
                          <Rating
                            {...field}
                            max={5}
                            value={field.value / 2}
                            onChange={(e, newValue) => field.onChange(newValue * 2)}
                            sx={{ fontSize: 40, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Score: {field.value} / 10
                          </Typography>
                          <Controller
                            name="qualificationsNotes"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Notes on qualifications..."
                                sx={{ mt: 2 }}
                              />
                            )}
                          />
                        </Box>
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Communication Skills Section */}
            <Card variant="outlined" sx={sectionCardSx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <RecordVoiceOver sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Communication & language
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Up to 20 points
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormLabel component="legend">Communication Skills</FormLabel>
                    <Controller
                      name="communicationSkills"
                      control={control}
                      rules={{ required: 'Please rate communication skills', min: 0, max: 10 }}
                      render={({ field }) => (
                        <Box>
                          <Rating
                            {...field}
                            max={5}
                            value={field.value / 2}
                            onChange={(e, newValue) => field.onChange(newValue * 2)}
                            sx={{ fontSize: 40, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Score: {field.value} / 10
                          </Typography>
                          <Controller
                            name="communicationSkillsNotes"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Notes on communication..."
                                sx={{ mt: 2 }}
                              />
                            )}
                          />
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormLabel component="legend">Language Proficiency</FormLabel>
                    <Controller
                      name="languageProficiency"
                      control={control}
                      rules={{ required: 'Please rate language proficiency', min: 0, max: 10 }}
                      render={({ field }) => (
                        <Box>
                          <Rating
                            {...field}
                            max={5}
                            value={field.value / 2}
                            onChange={(e, newValue) => field.onChange(newValue * 2)}
                            sx={{ fontSize: 40, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Score: {field.value} / 10
                          </Typography>
                          <Controller
                            name="languageProficiencyNotes"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Notes on language proficiency..."
                                sx={{ mt: 2 }}
                              />
                            )}
                          />
                        </Box>
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Problem Solving & Adaptability Section */}
            <Card variant="outlined" sx={sectionCardSx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <Lightbulb sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Problem solving & adaptability
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Up to 15 points
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormLabel component="legend">Problem Solving</FormLabel>
                    <Controller
                      name="problemSolving"
                      control={control}
                      rules={{ required: 'Please rate problem solving', min: 0, max: 8 }}
                      render={({ field }) => (
                        <Box>
                          <Rating
                            {...field}
                            max={4}
                            value={field.value / 2}
                            onChange={(e, newValue) => field.onChange(newValue * 2)}
                            sx={{ fontSize: 40, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Score: {field.value} / 8
                          </Typography>
                          <Controller
                            name="problemSolvingNotes"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Notes on problem solving..."
                                sx={{ mt: 2 }}
                              />
                            )}
                          />
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormLabel component="legend">Adaptability</FormLabel>
                    <Controller
                      name="adaptability"
                      control={control}
                      rules={{ required: 'Please rate adaptability', min: 0, max: 7 }}
                      render={({ field }) => (
                        <Box>
                          <Rating
                            {...field}
                            max={4}
                            value={field.value / 1.75}
                            onChange={(e, newValue) => field.onChange(Math.round(newValue * 1.75))}
                            sx={{ fontSize: 40, mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Score: {field.value} / 7
                          </Typography>
                          <Controller
                            name="adaptabilityNotes"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Notes on adaptability..."
                                sx={{ mt: 2 }}
                              />
                            )}
                          />
                        </Box>
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Overall Assessment */}
            <Card variant="outlined" sx={sectionCardSx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <Star sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Overall impression
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Up to 10 points
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Box sx={{ mb: 0 }}>
                  <FormLabel component="legend">Overall Impression</FormLabel>
                  <Controller
                    name="overallImpression"
                    control={control}
                    rules={{ required: 'Please provide overall impression', min: 0, max: 10 }}
                    render={({ field }) => (
                      <Box>
                        <Rating
                          {...field}
                          max={5}
                          value={field.value / 2}
                          onChange={(e, newValue) => field.onChange(newValue * 2)}
                          sx={{ fontSize: 40, mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Score: {field.value} / 10
                        </Typography>
                        <Controller
                          name="overallImpressionNotes"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              multiline
                              rows={3}
                              placeholder="Overall impression and comments..."
                              sx={{ mt: 2 }}
                            />
                          )}
                        />
                      </Box>
                    )}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card variant="outlined" sx={sectionCardSx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <CheckCircle sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Final recommendation
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aligns with score; you can override below
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Controller
                  name="recommendation"
                  control={control}
                  rules={{ required: 'Please select a recommendation' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.recommendation}>
                      <FormLabel component="legend">Recommendation</FormLabel>
                      <RadioGroup {...field} row sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        <FormControlLabel
                          value="strongly_recommend"
                          control={<Radio />}
                          label="Strongly Recommend"
                        />
                        <FormControlLabel
                          value="recommend"
                          control={<Radio />}
                          label="Recommend"
                        />
                        <FormControlLabel
                          value="consider"
                          control={<Radio />}
                          label="Consider"
                        />
                        <FormControlLabel
                          value="not_recommend"
                          control={<Radio />}
                          label="Not Recommend"
                        />
                      </RadioGroup>
                      {errors.recommendation && (
                        <FormHelperText>{errors.recommendation.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
                <Controller
                  name="recommendationNotes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Additional notes on recommendation..."
                      sx={{ mt: 2 }}
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card variant="outlined" sx={sectionCardSx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  <Notes sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Additional notes
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Strengths, gaps, and other observations
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="strengths"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Strengths"
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Key strengths observed during interview..."
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="weaknesses"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Areas for Improvement"
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Areas that need improvement..."
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="additionalNotes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Additional Notes"
                          fullWidth
                          multiline
                          rows={4}
                          placeholder="Any other observations or comments..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Submit */}
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Ready to submit?
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total {totalScore}/100 · {getRecommendationLabel(recommendation)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexShrink: 0 }}>
                <Button variant="outlined" onClick={() => router.back()} disabled={submitting} sx={{ textTransform: 'none' }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                  disabled={submitting}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(123, 15, 245, 0.35)',
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit assessment'}
                </Button>
              </Box>
            </Paper>
          </form>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InterviewAssessmentForm;
