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
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import {
  Person,
  Work,
  Assessment,
  Send,
  ArrowBack,
  CheckCircle,
  Schedule,
  Star,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import api from '../../utils/api';

const InterviewAssessmentForm = ({ applicationId, interviewerId, onSuccess }) => {
  const router = useRouter();
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !applicationData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const application = applicationData || {};

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
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
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assessment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                  Interview Assessment Form
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Application ID: {applicationId}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Application Information */}
          <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 1 }} />
              Candidate Information
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {application.fullName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Job Category</Typography>
                <Typography variant="body1">
                  {application.jobCategory || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Experience</Typography>
                <Typography variant="body1">
                  {application.experienceYears || 'N/A'} years
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">
                  {application.email || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Total Score Display */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 4,
              bgcolor: `${getScoreColor(totalScore)}.light`,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Total Assessment Score
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
            <LinearProgress
              variant="determinate"
              value={totalScore}
              sx={{ mt: 2, height: 10, borderRadius: 5 }}
              color={getScoreColor(totalScore)}
            />
            <Box sx={{ mt: 2 }}>
              <Chip
                label={getRecommendationLabel(recommendation)}
                color={getRecommendationColor(recommendation)}
                size="large"
              />
            </Box>
          </Paper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Assessment Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Interview Details */}
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ mr: 1 }} />
                  Interview Details
                </Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
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
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Technical Skills & Knowledge (0-30 points)
                </Typography>
                <Box sx={{ mb: 3 }}>
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
                          sx={{ fontSize: 40, mb: 1 }}
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
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Experience & Qualifications (0-25 points)
                </Typography>
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
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Communication Skills (0-20 points)
                </Typography>
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
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Problem Solving & Adaptability (0-15 points)
                </Typography>
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
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overall Assessment (0-10 points)
                </Typography>
                <Box sx={{ mb: 3 }}>
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
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Final Recommendation
                </Typography>
                <Controller
                  name="recommendation"
                  control={control}
                  rules={{ required: 'Please select a recommendation' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.recommendation}>
                      <FormLabel component="legend">Recommendation</FormLabel>
                      <RadioGroup {...field} row>
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
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
                </Typography>
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

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
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
                size="large"
                startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InterviewAssessmentForm;
