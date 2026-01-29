import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  Chip,
  Paper,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import {
  Business,
  Work,
  LocationOn,
  AttachMoney,
  Schedule,
  Home,
  DirectionsBus,
  CheckCircle,
  Send,
  Save,
  ArrowBack,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import LanguageSelector from '../Common/LanguageSelector';

const MERFForm = ({ requisitionId = null, templateId = null, onSuccess, mode = 'create' }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [complianceFlags, setComplianceFlags] = useState([]);
  const [template, setTemplate] = useState(null);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      // Basic Information
      title: '',
      titleHe: '',
      description: '',
      descriptionHe: '',
      jobCategory: '',
      specificTrade: '',
      numberOfWorkers: 1,
      experienceRequired: '',
      
      // Job Details
      qualifications: [],
      languagesRequired: [],
      salaryRange: '',
      workLocation: '',
      workLocationHe: '',
      startDate: null,
      contractDuration: '',
      
      // Benefits
      accommodationProvided: false,
      accommodationDetails: '',
      transportationProvided: false,
      otherBenefits: '',
      otherBenefitsHe: '',
      
      // Metadata
      language: i18n.language || 'en',
    },
  });

  const sections = [
    { label: t('merf.sections.basic') || 'Basic Information', icon: <Business /> },
    { label: t('merf.sections.jobDetails') || 'Job Details', icon: <Work /> },
    { label: t('merf.sections.location') || 'Work Location', icon: <LocationOn /> },
    { label: t('merf.sections.benefits') || 'Benefits & Conditions', icon: <AttachMoney /> },
    { label: t('merf.sections.review') || 'Review & Submit', icon: <CheckCircle /> },
  ];

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
    if (requisitionId && mode === 'edit') {
      loadRequisition();
    }
  }, [templateId, requisitionId, mode]);

  useEffect(() => {
    // Watch form values for compliance checking
    const subscription = watch((value, { name }) => {
      if (name && ['salaryRange', 'contractDuration'].includes(name)) {
        checkCompliance(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const loadTemplate = async () => {
    try {
      const response = await api.get(`/merf/templates/${templateId}`);
      if (response.data.success) {
        setTemplate(response.data.data);
        // Pre-fill form with template data
        const templateData = response.data.data;
        if (templateData.fields) {
          const fields = typeof templateData.fields === 'string' 
            ? JSON.parse(templateData.fields) 
            : templateData.fields;
          fields.forEach((field) => {
            if (field.value !== undefined) {
              setValue(field.name, field.value);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const loadRequisition = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/merf/requisitions/${requisitionId}`);
      if (response.data.success) {
        const req = response.data.data;
        // Populate form with requisition data
        Object.keys(req).forEach((key) => {
          if (req[key] !== null && req[key] !== undefined) {
            if (key === 'qualifications' || key === 'languagesRequired') {
              setValue(key, typeof req[key] === 'string' ? JSON.parse(req[key]) : req[key]);
            } else {
              setValue(key, req[key]);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading requisition:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCompliance = async (formData) => {
    try {
      const response = await api.post('/merf/compliance/check', formData);
      if (response.data.success) {
        setComplianceFlags(response.data.data.flags || []);
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
    }
  };

  const handleNext = async () => {
    // Check compliance before moving to next step
    const values = watch();
    await checkCompliance(values);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      // Final compliance check
      await checkCompliance(data);

      const requisitionData = {
        ...data,
        qualifications: Array.isArray(data.qualifications) 
          ? data.qualifications 
          : data.qualifications ? [data.qualifications] : [],
        languagesRequired: Array.isArray(data.languagesRequired)
          ? data.languagesRequired
          : data.languagesRequired ? [data.languagesRequired] : [],
        templateId: templateId || template?.id || null,
        language: i18n.language || 'en',
      };

      const response = requisitionId && mode === 'edit'
        ? await api.put(`/merf/requisitions/${requisitionId}`, requisitionData)
        : await api.post('/merf/requisitions', requisitionData);

      if (response.data.success) {
        if (onSuccess) {
          onSuccess(response.data.data);
        } else {
          router.push(`/merf/success?requisitionId=${response.data.data.id}`);
        }
      }
    } catch (error) {
      console.error('Error submitting MERF:', error);
      alert(error.response?.data?.message || 'Failed to submit requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('merf.basicInfo.title') || 'Basic Information'}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="title"
          control={control}
          rules={{ required: 'Title is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.title') || 'Title (English)'}
              fullWidth
              required
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="titleHe"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.titleHe') || 'Title (Hebrew)'}
              fullWidth
              dir="rtl"
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="description"
          control={control}
          rules={{ required: 'Description is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.description') || 'Description (English)'}
              fullWidth
              multiline
              rows={4}
              required
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="descriptionHe"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.descriptionHe') || 'Description (Hebrew)'}
              fullWidth
              multiline
              rows={4}
              dir="rtl"
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="jobCategory"
          control={control}
          rules={{ required: 'Job category is required' }}
          render={({ field }) => (
            <FormControl fullWidth required error={!!errors.jobCategory}>
              <InputLabel>{t('merf.fields.jobCategory') || 'Job Category'}</InputLabel>
              <Select {...field} label={t('merf.fields.jobCategory') || 'Job Category'}>
                <MenuItem value="Construction">Construction</MenuItem>
                <MenuItem value="Agriculture">Agriculture</MenuItem>
                <MenuItem value="Healthcare">Healthcare</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="Hospitality">Hospitality</MenuItem>
                <MenuItem value="Manufacturing">Manufacturing</MenuItem>
              </Select>
              {errors.jobCategory && (
                <FormHelperText>{errors.jobCategory.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="specificTrade"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.specificTrade') || 'Specific Trade'}
              fullWidth
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="numberOfWorkers"
          control={control}
          rules={{ required: 'Number of workers is required', min: { value: 1, message: 'Must be at least 1' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.numberOfWorkers') || 'Number of Workers'}
              type="number"
              fullWidth
              required
              inputProps={{ min: 1 }}
              error={!!errors.numberOfWorkers}
              helperText={errors.numberOfWorkers?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="experienceRequired"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>{t('merf.fields.experienceRequired') || 'Experience Required'}</InputLabel>
              <Select {...field} label={t('merf.fields.experienceRequired') || 'Experience Required'}>
                <MenuItem value="0-1">0-1 years</MenuItem>
                <MenuItem value="2-4">2-4 years</MenuItem>
                <MenuItem value="5-9">5-9 years</MenuItem>
                <MenuItem value="10+">10+ years</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
    </Grid>
  );

  const renderJobDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('merf.jobDetails.title') || 'Job Details'}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="qualifications"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.qualifications') || 'Required Qualifications'}
              fullWidth
              multiline
              rows={3}
              placeholder="e.g., Safety certification, Technical skills, etc."
              helperText="Enter qualifications separated by commas"
              onChange={(e) => {
                const value = e.target.value.split(',').map(q => q.trim()).filter(q => q);
                field.onChange(value);
              }}
              value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="languagesRequired"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.languagesRequired') || 'Languages Required'}
              fullWidth
              multiline
              rows={2}
              placeholder="e.g., English, Hebrew, Hindi"
              helperText="Enter languages separated by commas"
              onChange={(e) => {
                const value = e.target.value.split(',').map(l => l.trim()).filter(l => l);
                field.onChange(value);
              }}
              value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="salaryRange"
          control={control}
          rules={{ required: 'Salary range is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.salaryRange') || 'Salary Range (ILS)'}
              fullWidth
              required
              placeholder="e.g., 8000-12000"
              error={!!errors.salaryRange}
              helperText={errors.salaryRange?.message || 'Minimum wage: ILS 5,300'}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="contractDuration"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.contractDuration') || 'Contract Duration'}
              fullWidth
              placeholder="e.g., 12 months, 24 months"
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                {...field}
                label={t('merf.fields.startDate') || 'Expected Start Date'}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          )}
        />
      </Grid>
    </Grid>
  );

  const renderWorkLocation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('merf.location.title') || 'Work Location'}
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="workLocation"
          control={control}
          rules={{ required: 'Work location is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.workLocation') || 'Work Location (English)'}
              fullWidth
              required
              error={!!errors.workLocation}
              helperText={errors.workLocation?.message}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="workLocationHe"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.workLocationHe') || 'Work Location (Hebrew)'}
              fullWidth
              dir="rtl"
            />
          )}
        />
      </Grid>
    </Grid>
  );

  const renderBenefits = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('merf.benefits.title') || 'Benefits & Conditions'}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="accommodationProvided"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label={t('merf.fields.accommodationProvided') || 'Accommodation Provided'}
            />
          )}
        />
      </Grid>
      {watch('accommodationProvided') && (
        <Grid item xs={12}>
          <Controller
            name="accommodationDetails"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('merf.fields.accommodationDetails') || 'Accommodation Details'}
                fullWidth
                multiline
                rows={3}
              />
            )}
          />
        </Grid>
      )}
      <Grid item xs={12}>
        <Controller
          name="transportationProvided"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label={t('merf.fields.transportationProvided') || 'Transportation Provided'}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="otherBenefits"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.otherBenefits') || 'Other Benefits (English)'}
              fullWidth
              multiline
              rows={3}
            />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Controller
          name="otherBenefitsHe"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t('merf.fields.otherBenefitsHe') || 'Other Benefits (Hebrew)'}
              fullWidth
              multiline
              rows={3}
              dir="rtl"
            />
          )}
        />
      </Grid>
    </Grid>
  );

  const renderReview = () => {
    const values = watch();
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {t('merf.review.title') || 'Review & Submit'}
          </Typography>
        </Grid>
        
        {/* Compliance Flags */}
        {complianceFlags.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Compliance Issues Detected
              </Typography>
              {complianceFlags.map((flag, index) => (
                <Typography key={index} variant="body2">
                  • {flag.message}
                </Typography>
              ))}
            </Alert>
          </Grid>
        )}

        {/* Summary */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={600}>
              Requisition Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Title</Typography>
                <Typography variant="body1">{values.title}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Job Category</Typography>
                <Typography variant="body1">{values.jobCategory}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Number of Workers</Typography>
                <Typography variant="body1">{values.numberOfWorkers}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Salary Range</Typography>
                <Typography variant="body1">{values.salaryRange || 'Not specified'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Work Location</Typography>
                <Typography variant="body1">{values.workLocation}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Accommodation</Typography>
                <Typography variant="body1">
                  {values.accommodationProvided ? 'Yes' : 'No'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderJobDetails();
      case 2:
        return renderWorkLocation();
      case 3:
        return renderBenefits();
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {mode === 'edit' ? 'Edit MERF' : 'Create MERF Requisition'}
        </Typography>
        <LanguageSelector />
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {sections.map((section, index) => (
              <Step key={index}>
                <StepLabel icon={section.icon}>{section.label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ minHeight: '400px', mb: 3 }}>
              {renderStepContent()}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
              >
                {t('form.buttons.back') || 'Back'}
              </Button>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep < sections.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<NavigateNext />}
                  >
                    {t('form.buttons.next') || 'Next'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const values = watch();
                        // Save as draft
                        console.log('Saving draft:', values);
                      }}
                      startIcon={<Save />}
                    >
                      {t('form.buttons.save') || 'Save Draft'}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : (t('form.buttons.submit') || 'Submit')}
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MERFForm;
