import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
} from '@mui/material';
import {
  AutoAwesome,
  ContentCopy,
  CheckCircle,
  Warning,
  Refresh,
  Close,
} from '@mui/icons-material';
import api from '../../utils/api';

const AIJobGenerator = ({ onGenerated, initialData = {}, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState(null);
  const [aiAvailable, setAiAvailable] = useState(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    jobCategory: initialData.category || '',
    specificTrade: initialData.specificTrade || '',
    experienceRequired: initialData.experience || '',
    qualifications: initialData.requirements ? (Array.isArray(initialData.requirements) ? initialData.requirements.join(', ') : initialData.requirements) : '',
    languagesRequired: '',
    salaryRange: initialData.salary || '',
    workLocation: initialData.location || '',
    numberOfWorkers: 1,
    contractDuration: '',
    accommodationProvided: false,
    transportationProvided: false,
    otherBenefits: '',
    language: 'en',
    tone: 'professional',
    includeBenefits: true,
    includeRequirements: true,
    includeCompliance: true,
  });

  React.useEffect(() => {
    checkAIAvailability();
  }, []);

  const checkAIAvailability = async () => {
    try {
      const response = await api.get('/ai-job-generator/status');
      setAiAvailable(response.data.data.available);
    } catch (error) {
      console.error('Error checking AI availability:', error);
      setAiAvailable(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setGenerated(null);

      const payload = {
        ...formData,
        qualifications: formData.qualifications
          ? formData.qualifications.split(',').map(q => q.trim()).filter(q => q)
          : [],
        languagesRequired: formData.languagesRequired
          ? formData.languagesRequired.split(',').map(l => l.trim()).filter(l => l)
          : [],
      };

      const response = await api.post('/ai-job-generator/generate', payload);

      if (response.data.success) {
        setGenerated(response.data.data);
      }
    } catch (err) {
      console.error('Error generating job post:', err);
      setError(err.response?.data?.message || 'Failed to generate job post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseGenerated = () => {
    if (generated && generated.jobPost) {
      const jobPost = generated.jobPost;
      if (onGenerated) {
        onGenerated({
          title: jobPost.title || formData.specificTrade || formData.jobCategory,
          description: jobPost.description || '',
          requirements: jobPost.requirements || [],
          salary: jobPost.salaryRange || formData.salaryRange,
          experience: formData.experienceRequired,
          category: formData.jobCategory,
          location: formData.workLocation,
        });
      }
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (aiAvailable === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (aiAvailable === false) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        <Typography variant="body2">
          AI job generator is not available. Please configure OPENAI_API_KEY in the backend.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          AI Job Post Generator
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {generated && generated.complianceFlags && generated.complianceFlags.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Compliance Issues Detected
          </Typography>
          {generated.complianceFlags.map((flag, index) => (
            <Typography key={index} variant="body2">
              • {flag.message}
            </Typography>
          ))}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Job Category</InputLabel>
            <Select
              value={formData.jobCategory}
              label="Job Category"
              onChange={(e) => handleInputChange('jobCategory', e.target.value)}
            >
              <MenuItem value="Construction">Construction</MenuItem>
              <MenuItem value="Agriculture">Agriculture</MenuItem>
              <MenuItem value="Healthcare">Healthcare</MenuItem>
              <MenuItem value="IT">IT</MenuItem>
              <MenuItem value="Hospitality">Hospitality</MenuItem>
              <MenuItem value="Manufacturing">Manufacturing</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Specific Trade (Optional)"
            value={formData.specificTrade}
            onChange={(e) => handleInputChange('specificTrade', e.target.value)}
            placeholder="e.g., Electrician, Plumber"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Work Location"
            value={formData.workLocation}
            onChange={(e) => handleInputChange('workLocation', e.target.value)}
            required
            placeholder="e.g., Tel Aviv, Jerusalem"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Salary Range (ILS)"
            value={formData.salaryRange}
            onChange={(e) => handleInputChange('salaryRange', e.target.value)}
            placeholder="e.g., 8000-12000"
            helperText="Minimum wage: ILS 5,300"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Experience Required</InputLabel>
            <Select
              value={formData.experienceRequired}
              label="Experience Required"
              onChange={(e) => handleInputChange('experienceRequired', e.target.value)}
            >
              <MenuItem value="0-1">0-1 years</MenuItem>
              <MenuItem value="2-4">2-4 years</MenuItem>
              <MenuItem value="5-9">5-9 years</MenuItem>
              <MenuItem value="10+">10+ years</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Qualifications (comma-separated)"
            value={formData.qualifications}
            onChange={(e) => handleInputChange('qualifications', e.target.value)}
            placeholder="e.g., Safety certification, Technical skills"
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Languages Required (comma-separated)"
            value={formData.languagesRequired}
            onChange={(e) => handleInputChange('languagesRequired', e.target.value)}
            placeholder="e.g., English, Hebrew"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Tone</InputLabel>
            <Select
              value={formData.tone}
              label="Tone"
              onChange={(e) => handleInputChange('tone', e.target.value)}
            >
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="friendly">Friendly</MenuItem>
              <MenuItem value="formal">Formal</MenuItem>
              <MenuItem value="casual">Casual</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.accommodationProvided}
                onChange={(e) => handleInputChange('accommodationProvided', e.target.checked)}
              />
            }
            label="Accommodation Provided"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.transportationProvided}
                onChange={(e) => handleInputChange('transportationProvided', e.target.checked)}
              />
            }
            label="Transportation Provided"
            sx={{ ml: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.includeCompliance}
                onChange={(e) => handleInputChange('includeCompliance', e.target.checked)}
              />
            }
            label="Include Compliance Check"
            sx={{ ml: 2 }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
          onClick={handleGenerate}
          disabled={loading || !formData.jobCategory || !formData.workLocation}
          fullWidth
        >
          {loading ? 'Generating...' : 'Generate Job Post'}
        </Button>
      </Box>

      {generated && generated.jobPost && (
        <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Generated Job Post</Typography>
            <Box>
              <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(generated.jobPost.description || generated.raw)}
                >
                  {copied ? <CheckCircle color="success" /> : <ContentCopy />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {generated.jobPost.title && (
            <Typography variant="h6" gutterBottom>
              {generated.jobPost.title}
            </Typography>
          )}

          {generated.jobPost.description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {generated.jobPost.description}
              </Typography>
            </Box>
          )}

          {generated.jobPost.responsibilities && generated.jobPost.responsibilities.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Responsibilities
              </Typography>
              <List component="ul" sx={{ pl: 2 }}>
                {generated.jobPost.responsibilities.map((resp, index) => (
                  <li key={index}>
                    <Typography variant="body2">{resp}</Typography>
                  </li>
                ))}
              </List>
            </Box>
          )}

          {generated.jobPost.requirements && generated.jobPost.requirements.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Requirements
              </Typography>
              <List component="ul" sx={{ pl: 2 }}>
                {generated.jobPost.requirements.map((req, index) => (
                  <li key={index}>
                    <Typography variant="body2">{req}</Typography>
                  </li>
                ))}
              </List>
            </Box>
          )}

          {generated.complianceChecked && (
            <Chip
              icon={<CheckCircle />}
              label="Compliance Check Passed"
              color="success"
              size="small"
              sx={{ mt: 1 }}
            />
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={handleUseGenerated}
              fullWidth
            >
              Use This Job Post
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleGenerate}
              disabled={loading}
            >
              Regenerate
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AIJobGenerator;
