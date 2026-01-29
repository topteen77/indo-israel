import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormLabel,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MobileStepper,
  Fab,
  Box,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Warning,
  Info,
  Send,
  NavigateNext,
  NavigateBefore,
  Flag,
  Work,
  School,
  MedicalServices,
  Gavel,
  AttachFile,
  PhotoCamera,
  WhatsApp,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Assessment,
  Share,
  AutoAwesome,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { useTranslation } from 'react-i18next';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import api from '../../utils/api';
import FileUpload from '../Common/FileUpload';
import SignaturePad from '../Common/SignaturePad';
import LanguageSelector from '../Common/LanguageSelector';
import DocumentPreview from '../Common/DocumentPreview';
import LoadingOverlay from '../Common/LoadingOverlay';

// Safe trim: avoid calling .trim on non-strings (prevents "trim is not a function")
const safeTrim = (v) => (v != null && typeof v === 'string' ? v.trim() : '');

const IsraelSkilledWorkerForm = ({ applicationId = null, jobId = null, onSubmit, mode = 'create' }) => {
  const { t, i18n } = useTranslation();
  
  // Admin-only: Clear Form button (no autosave or draft; submit complete form only)
  const isAdmin = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('user') || '{}')?.role === 'admin'
    : false;
  
  // Fill Demo Data button should be available for all users (not just admin)
  const showDemoButton = true; // Available for everyone
  
  // Get demo data for testing
  const getDemoData = () => ({
    // Personal Details
    fullName: 'Rajesh Kumar',
    dateOfBirth: new Date(1990, 5, 15),
    gender: 'male',
    maritalStatus: 'married',
    mobileNumber: '9876543210',
    email: 'rajesh.kumar@example.com',
    permanentAddress: '123 Main Street, New Delhi, Delhi 110001, India',
    
    // Passport Details
    hasPassport: 'yes',
    passportNumber: 'A12345678',
    passportIssuePlace: 'New Delhi',
    passportIssueDate: new Date(2020, 0, 15),
    passportExpiryDate: new Date(2030, 0, 15),
    
    // Job Application
    jobCategory: 'construction', // Must match MenuItem value exactly (lowercase)
    specificTrade: 'Carpenter',
    experienceYears: '8', // Keep as string to match form field type
    workedAbroad: 'yes',
    countriesWorked: 'UAE, Saudi Arabia',
    
    // Skills & Language
    hasCertificate: 'yes',
    certificateDetails: 'ITI Certificate in Carpentry, Safety Training Certificate',
    canReadDrawings: 'yes',
    languages: ['hindi', 'english', 'arabic'],
    
    // Health & Legal
    medicalCondition: 'no',
    medicalDetails: '',
    criminalCase: 'no',
    criminalDetails: '',
    
    // Documents
    passportFiles: [],
    certificateFiles: [],
    workPhotos: [],
    
    // Declaration
    declaration: true, // Must be true for validation
    // Create a minimal valid data URL for demo signature (1x1 transparent PNG)
    digitalSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    submissionDate: new Date(),
  });
  
  const getDefaultValues = () => {
    return {
      // Personal Details
      fullName: '',
      dateOfBirth: null,
      gender: '',
      maritalStatus: '',
      mobileNumber: '',
      email: '',
      permanentAddress: '',
      
      // Passport Details
      hasPassport: '',
      passportNumber: '',
      passportIssuePlace: '',
      passportIssueDate: null,
      passportExpiryDate: null,
      
      // Job Application
      jobCategory: '',
      specificTrade: '',
      experienceYears: '',
      workedAbroad: '',
      countriesWorked: '',
      
      // Skills & Language
      hasCertificate: '',
      certificateDetails: '',
      canReadDrawings: '',
      languages: [],
      
      // Health & Legal
      medicalCondition: '',
      medicalDetails: '',
      criminalCase: '',
      criminalDetails: '',
      
      // Documents
      passportFiles: [],
      certificateFiles: [],
      workPhotos: [],
      
      // Declaration
      declaration: false,
      digitalSignature: '',
      submissionDate: new Date(),
    };
  };

  const defaultValues = getDefaultValues();
  
  // Ensure languages is always an array in defaultValues
  if (!Array.isArray(defaultValues.languages)) {
    defaultValues.languages = defaultValues.languages ? [defaultValues.languages] : [];
  }
  
  const { control, handleSubmit, watch, setValue, getValues, trigger, formState: { errors, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: defaultValues,
    shouldUnregister: false, // Keep values on unmount
  });

  const [activeStep, setActiveStep] = useState(0);
  
  // Track form values when step changes to detect value loss
  useEffect(() => {
    // #region agent log
    const currentValues = getValues();
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:371',message:'activeStep changed',data:{activeStep,values:{hasPassport:currentValues.hasPassport,workedAbroad:currentValues.workedAbroad,hasCertificate:currentValues.hasCertificate,canReadDrawings:currentValues.canReadDrawings,jobCategory:currentValues.jobCategory,specificTrade:currentValues.specificTrade}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);
  const [loading, setLoading] = useState(false);
  const [autoScore, setAutoScore] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState({
    passportFiles: [],
    certificateFiles: [],
    workPhotos: [],
  });
  const [showPreview, setShowPreview] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  // Pre-submit debug: show completed form data before sending
  const [showSubmitPreview, setShowSubmitPreview] = useState(false);
  const [pendingSubmissionData, setPendingSubmissionData] = useState(null);
  // Job applied to (when applying from a listing): used to pre-fill and show "Applying for: Title - Location"
  const [appliedJob, setAppliedJob] = useState(null);

  // Form sections
  const sections = [
    { id: 'personal', label: t('form.sections.personal'), icon: <Info /> },
    { id: 'passport', label: t('form.sections.passport'), icon: <Flag /> },
    { id: 'job', label: t('form.sections.job'), icon: <Work /> },
    { id: 'skills', label: t('form.sections.skills'), icon: <School /> },
    { id: 'health', label: t('form.sections.health'), icon: <MedicalServices /> },
    { id: 'documents', label: t('form.sections.documents'), icon: <AttachFile /> },
    { id: 'declaration', label: t('form.sections.declaration'), icon: <CheckCircle /> },
  ];

  // Watch form values for auto-scoring
  const watchedFields = watch([
    // Personal Details
    'fullName', 'dateOfBirth', 'gender', 'maritalStatus', 'mobileNumber', 'email', 'permanentAddress',
    // Passport Details
    'hasPassport', 'passportNumber', 'passportIssuePlace', 'passportIssueDate', 'passportExpiryDate',
    // Job Application
    'jobCategory', 'specificTrade', 'experienceYears', 'workedAbroad', 'countriesWorked',
    // Skills & Language
    'hasCertificate', 'certificateDetails', 'canReadDrawings', 'languages',
    // Health & Legal
    'medicalCondition', 'medicalDetails', 'criminalCase', 'criminalDetails',
    // Documents
    'passportFiles', 'certificateFiles', 'workPhotos',
    // Declaration
    'declaration', 'digitalSignature'
  ]);

  useEffect(() => {
    calculateAutoScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFields]);

  // Clear error message when user starts filling fields or navigates between steps
  useEffect(() => {
    if (submissionStatus && !submissionStatus.success) {
      // Clear error when form values change (user is fixing errors)
      setSubmissionStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFields, activeStep]);

  useEffect(() => {
    if (mode === 'edit' && applicationId) {
      loadApplicationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, mode]);

  // Load application data if editing
  useEffect(() => {
    if (applicationId && mode === 'edit') {
      loadApplicationData();
    }
  }, [applicationId, mode]);

  // Load user data from database and auto-fill form
  const loadUserData = async () => {
    if (applicationId || mode === 'edit') return; // Don't load user data when editing
    
    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user) {
        const user = response.data.user;
        const currentValues = getValues();
        
        // Fill empty fields from profile (GET /auth/me) only. No draft or autosave.
        if (user.fullName && (!currentValues.fullName || currentValues.fullName === '')) {
          setValue('fullName', user.fullName, { shouldValidate: false, shouldDirty: false });
        }
        
        if (user.email && (!currentValues.email || currentValues.email === '')) {
          setValue('email', user.email, { shouldValidate: false, shouldDirty: false });
        }
        
        if (user.phone && (!currentValues.mobileNumber || currentValues.mobileNumber === '')) {
          setValue('mobileNumber', user.phone, { shouldValidate: false, shouldDirty: false });
        }
        
        if (user.address && (!currentValues.permanentAddress || currentValues.permanentAddress === '')) {
          setValue('permanentAddress', user.address, { shouldValidate: false, shouldDirty: false });
        }
        
        console.log('User data loaded from database and form auto-filled:', {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address
        });
      }
    } catch (error) {
      console.error('Failed to load user data from database:', error);
      // If /auth/me fails, try to get from localStorage as fallback
      if (typeof window !== 'undefined') {
        try {
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentValues = getValues();
          
          if (localUser.fullName && (!currentValues.fullName || currentValues.fullName === '')) {
            setValue('fullName', localUser.fullName, { shouldValidate: false, shouldDirty: false });
          }
          if (localUser.email && (!currentValues.email || currentValues.email === '')) {
            setValue('email', localUser.email, { shouldValidate: false, shouldDirty: false });
          }
          console.log('User data loaded from localStorage as fallback');
        } catch (localError) {
          console.error('Failed to load user data from localStorage:', localError);
        }
      }
    }
  };

  // Parse date for form (ISO string or Date -> Date)
  const parseFormDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v === 'string') {
      try { return parseISO(v); } catch (_) { return null; }
    }
    return null;
  };

  // Load worker application profile or latest application - autofill so user doesn't re-enter
  const loadWorkerProfile = async () => {
    if (applicationId || mode === 'edit') return;
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
    const userId = user?.id;
    if (!userId) return;

    let profile = {};
    try {
      const response = await api.get('/auth/worker-profile');
      if (response.data.success && response.data.profile && Object.keys(response.data.profile).length > 0) {
        profile = response.data.profile;
      }
    } catch (_) {}

    // Fallback: if no worker_profile, fetch latest application from user's applications
    if (Object.keys(profile).length === 0) {
      try {
        const appsRes = await api.get(`/applications/all?userId=${userId}`);
        if (appsRes.data.success && appsRes.data.data?.length > 0) {
          const latest = appsRes.data.data[0];
          profile = {
            fullName: latest.fullName,
            email: latest.email,
            mobileNumber: latest.mobileNumber,
            permanentAddress: latest.permanentAddress,
            dateOfBirth: latest.dateOfBirth,
            gender: latest.gender,
            maritalStatus: latest.maritalStatus,
            hasPassport: latest.hasPassport,
            passportNumber: latest.passportNumber,
            passportIssuePlace: latest.passportIssuePlace,
            passportIssueDate: latest.passportIssueDate,
            passportExpiryDate: latest.passportExpiryDate,
            jobCategory: latest.jobCategory,
            specificTrade: latest.specificTrade,
            experienceYears: latest.experienceYears,
            workedAbroad: latest.workedAbroad,
            countriesWorked: latest.countriesWorked,
            hasCertificate: latest.hasCertificate,
            certificateDetails: latest.certificateDetails,
            canReadDrawings: latest.canReadDrawings,
            languages: latest.languages,
            medicalCondition: latest.medicalCondition,
            medicalDetails: latest.medicalDetails,
            criminalCase: latest.criminalCase,
            criminalDetails: latest.criminalDetails,
            files: latest.files,
          };
        }
      } catch (_) {}
    }

    if (Object.keys(profile).length === 0) return;

    // Always apply profile data (overwrite defaults) so 2nd application shows previous data
    const setFromProfile = (key, value) => {
      if (value === undefined || value === null) return;
      setValue(key, value, { shouldValidate: false, shouldDirty: false });
    };
    setFromProfile('fullName', profile.fullName);
    setFromProfile('email', profile.email);
    setFromProfile('mobileNumber', profile.mobileNumber);
    setFromProfile('permanentAddress', profile.permanentAddress);
    if (profile.dateOfBirth) setFromProfile('dateOfBirth', parseFormDate(profile.dateOfBirth));
    setFromProfile('gender', profile.gender);
    setFromProfile('maritalStatus', profile.maritalStatus);
    setFromProfile('hasPassport', profile.hasPassport);
    setFromProfile('passportNumber', profile.passportNumber);
    setFromProfile('passportIssuePlace', profile.passportIssuePlace);
    if (profile.passportIssueDate) setFromProfile('passportIssueDate', parseFormDate(profile.passportIssueDate));
    if (profile.passportExpiryDate) setFromProfile('passportExpiryDate', parseFormDate(profile.passportExpiryDate));
    setFromProfile('jobCategory', profile.jobCategory);
    setFromProfile('specificTrade', profile.specificTrade);
    setFromProfile('experienceYears', profile.experienceYears);
    setFromProfile('workedAbroad', profile.workedAbroad);
    setFromProfile('countriesWorked', profile.countriesWorked);
    setFromProfile('hasCertificate', profile.hasCertificate);
    setFromProfile('certificateDetails', profile.certificateDetails);
    setFromProfile('canReadDrawings', profile.canReadDrawings);
    if (profile.languages) setFromProfile('languages', Array.isArray(profile.languages) ? profile.languages : [profile.languages]);
    setFromProfile('medicalCondition', profile.medicalCondition);
    setFromProfile('medicalDetails', profile.medicalDetails);
    setFromProfile('criminalCase', profile.criminalCase);
    setFromProfile('criminalDetails', profile.criminalDetails);
    if (profile.files && Object.keys(profile.files).length > 0) {
      setFromProfile('passportFiles', profile.files.passportFiles || []);
      setFromProfile('certificateFiles', profile.files.certificateFiles || []);
      setFromProfile('workPhotos', profile.files.workPhotos || []);
    }
    console.log('Form pre-filled from previous application');
  };

  // Load user data, worker profile (previous application), then job data when form is in create mode
  useEffect(() => {
    if (mode === 'create' && !applicationId) {
      const timer = setTimeout(async () => {
        await loadUserData();
        await loadWorkerProfile(); // Pre-fill from previous application (profile or latest app)
        if (jobId) await loadJobData(); // Job-specific fields (category, trade) - runs after profile
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, applicationId, jobId]);

  // Fill demo data function
  const fillDemoData = () => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:699',message:'fillDemoData called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const demoData = getDemoData();
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:701',message:'fillDemoData demoData keys',data:{demoKeys:Object.keys(demoData),fullName:demoData.fullName,hasPassport:demoData.hasPassport,jobCategory:demoData.jobCategory,declaration:demoData.declaration,digitalSignature:demoData.digitalSignature?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Set required fields with validation enabled
    // Include all fields that have validation rules: fullName, hasPassport, jobCategory, experienceYears, 
    // workedAbroad, hasCertificate, canReadDrawings, declaration, digitalSignature
    const requiredFields = [
      'fullName', 
      'hasPassport', 
      'jobCategory', 
      'experienceYears',
      'workedAbroad',
      'hasCertificate',
      'canReadDrawings',
      'declaration', 
      'digitalSignature'
    ];
    
    requiredFields.forEach((key) => {
      if (demoData[key] !== undefined) {
        setValue(key, demoData[key], { shouldValidate: true, shouldDirty: true });
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:712',message:'fillDemoData setting required field',data:{key,value:demoData[key],valueType:typeof demoData[key]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }
    });
    
    // Set other fields without validation (to avoid unnecessary validation triggers)
    Object.keys(demoData).forEach((key) => {
      if (!requiredFields.includes(key)) {
        setValue(key, demoData[key], { shouldValidate: false, shouldDirty: true });
      }
    });
    
    // #region agent log
    setTimeout(() => {
      const valuesAfterFill = getValues();
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:730',message:'fillDemoData values after setValue',data:{fullName:valuesAfterFill.fullName,hasPassport:valuesAfterFill.hasPassport,jobCategory:valuesAfterFill.jobCategory,experienceYears:valuesAfterFill.experienceYears,workedAbroad:valuesAfterFill.workedAbroad,hasCertificate:valuesAfterFill.hasCertificate,canReadDrawings:valuesAfterFill.canReadDrawings,declaration:valuesAfterFill.declaration,digitalSignature:valuesAfterFill.digitalSignature?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }, 300);
    // #endregion
    
    // Trigger validation for all fields after a short delay
    setTimeout(async () => {
      await trigger();
      // #region agent log
      const valuesAfterTrigger = getValues();
      const currentErrors = Object.keys(errors);
      const errorDetails = currentErrors.map(key => ({
        field: key,
        message: errors[key]?.message || 'Required',
        value: valuesAfterTrigger[key],
        valueType: typeof valuesAfterTrigger[key]
      }));
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:740',message:'fillDemoData after trigger',data:{errorFields:currentErrors,errorDetails,valuesAfterTrigger:{fullName:valuesAfterTrigger.fullName,hasPassport:valuesAfterTrigger.hasPassport,jobCategory:valuesAfterTrigger.jobCategory,experienceYears:valuesAfterTrigger.experienceYears,workedAbroad:valuesAfterTrigger.workedAbroad,hasCertificate:valuesAfterTrigger.hasCertificate,canReadDrawings:valuesAfterTrigger.canReadDrawings}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }, 500);
    
    // Trigger recalculation
    setTimeout(() => {
      calculateAutoScore();
    }, 100);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
    return differenceInYears(new Date(), dob);
  };

  const calculateMonthsUntilExpiry = (expiryDate) => {
    if (!expiryDate) return 0;
    const exp = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
    return differenceInMonths(exp, new Date());
  };

  const calculateAutoScore = () => {
    let score = 0;
    const values = getValues();

    // Age scoring (21-45 preferred)
    if (values.dateOfBirth) {
      const age = calculateAge(values.dateOfBirth);
      if (age >= 21 && age <= 45) score += 15;
      else if (age >= 18 && age <= 50) score += 10;
      else score += 5;
    }

    // Experience scoring
    if (values.experienceYears) {
      const exp = parseInt(values.experienceYears) || 0;
      if (exp >= 10) score += 20;
      else if (exp >= 5) score += 15;
      else if (exp >= 2) score += 10;
      else if (exp >= 1) score += 5;
    }

    // Previous international experience
    if (values.workedAbroad === 'yes') score += 10;

    // Certificate scoring
    if (values.hasCertificate === 'yes') score += 15;

    // Language scoring
    if (values.languages && Array.isArray(values.languages)) {
      const langCount = values.languages.length;
      if (langCount >= 3) score += 15;
      else if (langCount >= 2) score += 10;
      else if (langCount >= 1) score += 5;
    }

    // Passport validity scoring
    if (values.passportExpiryDate) {
      const monthsValid = calculateMonthsUntilExpiry(values.passportExpiryDate);
      if (monthsValid >= 18) score += 10;
      else if (monthsValid >= 12) score += 5;
    }

    // Health declaration scoring
    if (values.medicalCondition === 'no') score += 10;

    // Legal declaration scoring
    if (values.criminalCase === 'no') score += 10;

    setAutoScore(score);
  };

  const determineRouting = (data) => {
    const jobCategory = data.jobCategory;
    const experience = parseInt(data.experienceYears) || 0;

    let route = 'employer_sponsored';
    let priority = 'standard';

    // G2G routing for specialist categories
    if (jobCategory === 'expert_specialist' || experience >= 10) {
      route = 'g2g_specialist';
      priority = 'high';
    }

    // High priority for construction/agriculture (government priority sectors)
    if (['construction', 'agriculture'].includes(jobCategory)) {
      priority = 'high';
    }

    // Country-wise tagging
    const countryTag = 'india';

    return {
      route,
      priority,
      countryTag,
      processingStream: getProcessingStream(data),
      estimatedTimeline: getEstimatedTimeline(priority),
    };
  };

  const getProcessingStream = (data) => {
    if (data.jobCategory === 'expert_specialist') return 'specialist_stream';
    if (['construction', 'agriculture'].includes(data.jobCategory)) return 'priority_stream';
    return 'standard_stream';
  };

  const getEstimatedTimeline = (priority) => {
    if (priority === 'high') return '4-6 weeks';
    return '8-12 weeks';
  };

  const generateSubmissionId = () => {
    return `ISR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const loadApplicationData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/israel-skilled-worker/${applicationId}`);
      const data = response.data.data || response.data;
      
      // Set form values
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          setValue(key, data[key]);
        }
      });
    } catch (error) {
      console.error('Failed to load application:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load job details and auto-fill form when jobId is provided
  const loadJobData = async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      // Preserve existing form values before loading job data
      const currentValues = getValues();
      
      const response = await api.get(`/jobs/${jobId}`);
      if (response.data.success && response.data.data) {
        const job = response.data.data;
        setAppliedJob(job);

        // Job category: always set from applied job so form reflects "Site Supervisor - Ashdod" etc.; user can change
        if (job.category) {
          const normalizedCategory = job.category.toLowerCase().replace(/\s+/g, '_');
          const categoryMap = {
            'construction': 'construction',
            'caregiving': 'caregiving',
            'care_giving': 'caregiving',
            'agriculture': 'agriculture',
            'manufacturing': 'manufacturing',
            'hospitality': 'hospitality',
            'expert_specialist': 'expert_specialist',
            'expert': 'expert_specialist',
            'specialist': 'expert_specialist',
          };
          const mappedCategory = categoryMap[normalizedCategory] || normalizedCategory;
          setValue('jobCategory', mappedCategory, { shouldValidate: false, shouldDirty: false });
        }

        // Trade/role: set from job title and location (e.g. "Site Supervisor - Ashdod"); user can change
        if (job.title) {
          const tradeDisplay = job.location ? `${job.title} - ${job.location}` : job.title;
          setValue('specificTrade', tradeDisplay, { shouldValidate: false, shouldDirty: false });
        }
        
        // If job has experience requirement, try to set experienceYears (only if empty)
        if (job.experience && (!currentValues.experienceYears || currentValues.experienceYears === '')) {
          const experienceMatch = job.experience.match(/(\d+)/);
          if (experienceMatch) {
            setValue('experienceYears', experienceMatch[1], { shouldValidate: false, shouldDirty: false });
          }
        }
        
        // Ensure fullName and other important fields are preserved after loading job data
        // Use a small delay to ensure all setValue calls have completed
        setTimeout(() => {
          const valuesAfterJobLoad = getValues();
          if (currentValues.fullName && (!valuesAfterJobLoad.fullName || valuesAfterJobLoad.fullName === '')) {
            setValue('fullName', currentValues.fullName, { shouldValidate: false, shouldDirty: false });
          }
          // Preserve other important fields that might have been cleared
          if (currentValues.email && (!valuesAfterJobLoad.email || valuesAfterJobLoad.email === '')) {
            setValue('email', currentValues.email, { shouldValidate: false, shouldDirty: false });
          }
          if (currentValues.mobileNumber && (!valuesAfterJobLoad.mobileNumber || valuesAfterJobLoad.mobileNumber === '')) {
            setValue('mobileNumber', currentValues.mobileNumber, { shouldValidate: false, shouldDirty: false });
          }
          
          // #region agent log
          const finalValues = getValues();
          fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1015',message:'loadJobData - after preserving values',data:{finalValues:{fullName:finalValues.fullName,email:finalValues.email,mobileNumber:finalValues.mobileNumber,jobCategory:finalValues.jobCategory},preservedFullName:currentValues.fullName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
        }, 100);
        
        console.log('Job data loaded and form auto-filled:', job);
      }
    } catch (error) {
      console.error('Failed to load job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // #region agent log
    const valuesBefore = getValues();
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:686',message:'handleNext called',data:{activeStep,nextStep:activeStep+1,valuesBefore:{jobCategory:valuesBefore.jobCategory,specificTrade:valuesBefore.specificTrade,experienceYears:valuesBefore.experienceYears}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (activeStep < sections.length - 1) {
      setActiveStep(activeStep + 1);
      // #region agent log
      setTimeout(() => {
        const valuesAfter = getValues();
        fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:690',message:'handleNext after setActiveStep',data:{activeStep:activeStep+1,valuesAfter:{jobCategory:valuesAfter.jobCategory,specificTrade:valuesAfter.specificTrade,experienceYears:valuesAfter.experienceYears}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }, 100);
      // #endregion
    }
  };

  const handleBack = () => {
    // #region agent log
    const valuesBefore = getValues();
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:691',message:'handleBack called',data:{activeStep,prevStep:activeStep-1,valuesBefore:{jobCategory:valuesBefore.jobCategory,specificTrade:valuesBefore.specificTrade,experienceYears:valuesBefore.experienceYears,fullName:valuesBefore.fullName,email:valuesBefore.email}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      // #region agent log
      setTimeout(() => {
        const valuesAfter = getValues();
        fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:695',message:'handleBack after setActiveStep',data:{activeStep:activeStep-1,valuesAfter:{jobCategory:valuesAfter.jobCategory,specificTrade:valuesAfter.specificTrade,experienceYears:valuesAfter.experienceYears,fullName:valuesAfter.fullName,email:valuesAfter.email}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }, 100);
      // #endregion
    }
  };

  // Map field names to their section/step index
  const getFieldStep = (fieldName) => {
    const fieldStepMap = {
      // Personal Details (Step 0)
      'fullName': 0,
      'dateOfBirth': 0,
      'gender': 0,
      'maritalStatus': 0,
      'mobileNumber': 0,
      'email': 0,
      'permanentAddress': 0,
      // Passport Details (Step 1)
      'hasPassport': 1,
      'passportNumber': 1,
      'passportIssuePlace': 1,
      'passportIssueDate': 1,
      'passportExpiryDate': 1,
      // Job Application (Step 2)
      'jobCategory': 2,
      'specificTrade': 2,
      'experienceYears': 2,
      'workedAbroad': 2,
      'countriesWorked': 2,
      // Skills (Step 3)
      'hasCertificate': 3,
      'certificateDetails': 3,
      'canReadDrawings': 3,
      'languages': 3,
      // Health & Legal (Step 4)
      'medicalCondition': 4,
      'medicalDetails': 4,
      'criminalCase': 4,
      'criminalDetails': 4,
      // Documents (Step 5)
      'passportFiles': 5,
      'certificateFiles': 5,
      'workPhotos': 5,
      // Declaration (Step 6)
      'declaration': 6,
      'digitalSignature': 6,
    };
    return fieldStepMap[fieldName] !== undefined ? fieldStepMap[fieldName] : 0;
  };

  // When submit is clicked but validation fails (RHF doesn't call onFormSubmit), show message and go to first error
  const onFormInvalid = (errors) => {
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      navigateToFirstMissingField(errorFields);
      setSubmissionStatus({
        success: false,
        error: t('form.messages.requiredFields') || 'Please fill all required fields. Complete the highlighted field.',
      });
    }
  };

  // Navigate to first missing required field
  const navigateToFirstMissingField = (missingFields) => {
    // #region agent log
    const valuesBefore = getValues();
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:742',message:'navigateToFirstMissingField called',data:{missingFields,activeStep,valuesBefore:{jobCategory:valuesBefore.jobCategory,specificTrade:valuesBefore.specificTrade,experienceYears:valuesBefore.experienceYears,fullName:valuesBefore.fullName}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!missingFields || missingFields.length === 0) return;

    // Find the step containing the first missing field
    const firstMissingField = missingFields[0];
    const targetStep = getFieldStep(firstMissingField);

    // Navigate to that step
    setActiveStep(targetStep);
    // #region agent log
    setTimeout(() => {
      const valuesAfter = getValues();
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:750',message:'navigateToFirstMissingField after setActiveStep',data:{targetStep,firstMissingField,valuesAfter:{jobCategory:valuesAfter.jobCategory,specificTrade:valuesAfter.specificTrade,experienceYears:valuesAfter.experienceYears,fullName:valuesAfter.fullName}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }, 100);
    // #endregion

    // Scroll to the form section after a brief delay
    setTimeout(() => {
      // Try multiple strategies to find and highlight the field
      let fieldElement = null;
      let fieldContainer = null;
      
      // Strategy 1: Find by name attribute (works for native inputs)
      fieldElement = document.querySelector(`input[name="${firstMissingField}"], select[name="${firstMissingField}"], textarea[name="${firstMissingField}"]`);
      
      // Strategy 2: Find MUI input by id pattern
      if (!fieldElement) {
        const muiInput = document.querySelector(`input[id*="${firstMissingField}"], select[id*="${firstMissingField}"]`);
        if (muiInput) {
          fieldElement = muiInput;
          fieldContainer = muiInput.closest('.MuiFormControl-root, .MuiTextField-root');
        }
      }
      
      // Strategy 3: Find by label text (for MUI components)
      if (!fieldElement) {
        const labels = Array.from(document.querySelectorAll('label'));
        const matchingLabel = labels.find(label => {
          const labelText = label.textContent?.toLowerCase() || '';
          const fieldName = firstMissingField.replace(/([A-Z])/g, ' $1').toLowerCase();
          return labelText.includes(fieldName) || label.getAttribute('for')?.includes(firstMissingField);
        });
        
        if (matchingLabel) {
          const labelFor = matchingLabel.getAttribute('for');
          if (labelFor) {
            fieldElement = document.getElementById(labelFor);
          }
          if (!fieldElement && matchingLabel.parentElement) {
            fieldContainer = matchingLabel.closest('.MuiFormControl-root, .MuiTextField-root');
            if (fieldContainer) {
              fieldElement = fieldContainer.querySelector('input, select, textarea');
            }
          }
        }
      }
      
      // Strategy 4: Find the Grid item containing error message
      if (!fieldElement) {
        const errorAlerts = Array.from(document.querySelectorAll('.MuiAlert-root, .MuiFormHelperText-root'));
        const relevantError = errorAlerts.find(alert => {
          const text = alert.textContent?.toLowerCase() || '';
          return text.includes(firstMissingField.toLowerCase()) || text.includes('required');
        });
        
        if (relevantError) {
          fieldContainer = relevantError.closest('.MuiGrid-item, .MuiFormControl-root');
          if (fieldContainer) {
            fieldElement = fieldContainer.querySelector('input, select, textarea');
          }
        }
      }
      
      // Scroll and highlight
      if (fieldElement || fieldContainer) {
        const targetElement = fieldElement || fieldContainer;
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
          // Focus the input if found
          if (fieldElement && fieldElement.focus) {
            fieldElement.focus();
          }
          
          // Highlight the container
          const containerToHighlight = fieldContainer || fieldElement?.closest('.MuiFormControl-root, .MuiTextField-root, .MuiGrid-item');
          if (containerToHighlight) {
            containerToHighlight.style.transition = 'all 0.3s ease';
            containerToHighlight.style.outline = '3px solid rgba(244, 67, 54, 0.5)';
            containerToHighlight.style.outlineOffset = '2px';
            containerToHighlight.style.borderRadius = '8px';
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
              containerToHighlight.style.outline = '';
              containerToHighlight.style.outlineOffset = '';
            }, 3000);
          }
        }, 300);
      } else {
        // Fallback: scroll to step content
        const stepContent = document.querySelector('[data-step-content]');
        if (stepContent) {
          stepContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 200);
  };

  const onFormSubmit = async (data) => {
    // #region agent log
    const valuesBeforeValidation = getValues();
    const allRadioValues = {
      hasPassport: data.hasPassport,
      workedAbroad: data.workedAbroad,
      hasCertificate: data.hasCertificate,
      canReadDrawings: data.canReadDrawings,
      medicalCondition: data.medicalCondition,
      criminalCase: data.criminalCase,
      gender: data.gender,
      maritalStatus: data.maritalStatus
    };
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:860',message:'onFormSubmit called - initial data',data:{formData:{fullName:data.fullName,fullNameType:typeof data.fullName,fullNameLength:data.fullName?.length,hasPassport:data.hasPassport,workedAbroad:data.workedAbroad,hasCertificate:data.hasCertificate,canReadDrawings:data.canReadDrawings,medicalCondition:data.medicalCondition,criminalCase:data.criminalCase,gender:data.gender,maritalStatus:data.maritalStatus,jobCategory:data.jobCategory,experienceYears:data.experienceYears,dateOfBirth:data.dateOfBirth,mobileNumber:data.mobileNumber,email:data.email,declaration:data.declaration,digitalSignature:data.digitalSignature?.length||0},allRadioValues,valuesBeforeValidation:{fullName:valuesBeforeValidation.fullName,fullNameType:typeof valuesBeforeValidation.fullName,hasPassport:valuesBeforeValidation.hasPassport,workedAbroad:valuesBeforeValidation.workedAbroad,gender:valuesBeforeValidation.gender,maritalStatus:valuesBeforeValidation.maritalStatus}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Ensure fullName is a valid string before validation (safeTrim avoids trim-is-not-a-function)
    if (safeTrim(data.fullName) === '') {
      const currentFullName = getValues().fullName;
      if (safeTrim(currentFullName) !== '') {
        data.fullName = currentFullName;
        setValue('fullName', currentFullName, { shouldValidate: true });
      }
    }
    
    // Trigger validation on all fields
    const isValid = await trigger();
    
    // #region agent log
    const valuesAfterValidation = getValues();
    const errorDetails = Object.keys(errors).map(key => ({
      field: key,
      message: errors[key]?.message || 'Required',
      value: valuesAfterValidation[key],
      valueType: typeof valuesAfterValidation[key]
    }));
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:826',message:'onFormSubmit after trigger',data:{isValid,errorFields:Object.keys(errors),errorDetails,valuesAfterValidation:{declaration:valuesAfterValidation.declaration,digitalSignature:valuesAfterValidation.digitalSignature?.length||0,fullName:valuesAfterValidation.fullName,email:valuesAfterValidation.email,jobCategory:valuesAfterValidation.jobCategory,specificTrade:valuesAfterValidation.specificTrade,experienceYears:valuesAfterValidation.experienceYears}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!isValid) {
      // Get all error fields
      const errorFields = Object.keys(errors);
      
      if (errorFields.length > 0) {
        // Navigate to first error field
        navigateToFirstMissingField(errorFields);
        
        // #region agent log
        setTimeout(() => {
          const valuesAfterNavigate = getValues();
          fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:840',message:'onFormSubmit after navigateToFirstMissingField',data:{valuesAfterNavigate:{jobCategory:valuesAfterNavigate.jobCategory,specificTrade:valuesAfterNavigate.specificTrade,experienceYears:valuesAfterNavigate.experienceYears,fullName:valuesAfterNavigate.fullName}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        }, 200);
        // #endregion
        
        setSubmissionStatus({
          success: false,
          error: `${t('form.messages.requiredFields') || 'Please fill all required fields'}. Please complete the highlighted field.`,
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Auto-assign routing based on job category
      const routingData = determineRouting(data);

      // Serialize dates to ISO strings for API submission
      const serializeDates = (obj) => {
        const serialized = { ...obj };
        if (serialized.dateOfBirth && serialized.dateOfBirth instanceof Date) {
          serialized.dateOfBirth = serialized.dateOfBirth.toISOString();
        }
        if (serialized.passportIssueDate && serialized.passportIssueDate instanceof Date) {
          serialized.passportIssueDate = serialized.passportIssueDate.toISOString();
        }
        if (serialized.passportExpiryDate && serialized.passportExpiryDate instanceof Date) {
          serialized.passportExpiryDate = serialized.passportExpiryDate.toISOString();
        }
        if (serialized.submissionDate && serialized.submissionDate instanceof Date) {
          serialized.submissionDate = serialized.submissionDate.toISOString();
        }
        return serialized;
      };

      // Get user ID from localStorage
      const user = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : null;
      const userId = user?.id || null;

      // Profile update happens on confirm (in performSubmission), not here

      // Add auto-scoring and metadata
      const serializedData = serializeDates(data);
      // #region agent log
      const radioValuesAfterSerialize = {
        hasPassport: serializedData.hasPassport,
        workedAbroad: serializedData.workedAbroad,
        hasCertificate: serializedData.hasCertificate,
        canReadDrawings: serializedData.canReadDrawings,
        medicalCondition: serializedData.medicalCondition,
        criminalCase: serializedData.criminalCase,
        gender: serializedData.gender,
        maritalStatus: serializedData.maritalStatus
      };
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1291',message:'Data after serializeDates',data:{serializedData:{fullName:serializedData.fullName,hasPassport:serializedData.hasPassport,workedAbroad:serializedData.workedAbroad,hasCertificate:serializedData.hasCertificate,canReadDrawings:serializedData.canReadDrawings,medicalCondition:serializedData.medicalCondition,criminalCase:serializedData.criminalCase,gender:serializedData.gender,maritalStatus:serializedData.maritalStatus,jobCategory:serializedData.jobCategory,experienceYears:serializedData.experienceYears,dateOfBirth:serializedData.dateOfBirth,mobileNumber:serializedData.mobileNumber,email:serializedData.email,declaration:serializedData.declaration,digitalSignature:serializedData.digitalSignature?.length||0},radioValuesAfterSerialize,originalData:{fullName:data.fullName,hasPassport:data.hasPassport,workedAbroad:data.workedAbroad}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Ensure backend-required fields are always in payload (can be missing from data when step 1 is unmounted)
      const currentValues = getValues();
      const submissionData = {
        ...serializedData,
        jobCategory: serializedData.jobCategory ?? currentValues.jobCategory ?? '',
        experienceYears: serializedData.experienceYears ?? currentValues.experienceYears ?? '',
        specificTrade: serializedData.specificTrade ?? currentValues.specificTrade ?? null,
        autoScore,
        routing: routingData,
        submissionId: generateSubmissionId(),
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        language: i18n.language,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        ipAddress: await getClientIP().catch(() => 'unknown'),
        files: uploadedFiles,
        jobId: jobId || null, // Include jobId if provided
        userId: userId, // Include userId for tracking
      };
      // #region agent log
      const submissionRadioValues = {
        hasPassport: submissionData.hasPassport,
        workedAbroad: submissionData.workedAbroad,
        hasCertificate: submissionData.hasCertificate,
        canReadDrawings: submissionData.canReadDrawings,
        medicalCondition: submissionData.medicalCondition,
        criminalCase: submissionData.criminalCase,
        gender: submissionData.gender,
        maritalStatus: submissionData.maritalStatus
      };
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1295',message:'submissionData created',data:{submissionData:{fullName:submissionData.fullName,hasPassport:submissionData.hasPassport,workedAbroad:submissionData.workedAbroad,hasCertificate:submissionData.hasCertificate,canReadDrawings:submissionData.canReadDrawings,medicalCondition:submissionData.medicalCondition,criminalCase:submissionData.criminalCase,gender:submissionData.gender,maritalStatus:submissionData.maritalStatus},submissionRadioValues,serializedDataFullName:serializedData.fullName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Debug popup: only when NEXT_PUBLIC_APPLICATION_DEBUG=true in env
      const isApplicationDebug = process.env.NEXT_PUBLIC_APPLICATION_DEBUG === 'true';
      if (isApplicationDebug) {
        setPendingSubmissionData(submissionData);
        setShowSubmitPreview(true);
        return;
      }
      await performSubmission(submissionData);
    } catch (previewError) {
      console.error('Error building submission preview:', previewError);
      setSubmissionStatus({ success: false, error: 'Failed to prepare submission. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Perform actual API submit after user confirms in preview dialog
  const performSubmission = async (submissionData) => {
    if (!submissionData) return;
    setLoading(true);
    try {
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;
      const userId = user?.id || null;

      // Update user profile (PUT /auth/me)
      if (userId && mode === 'create') {
        try {
          const updateFields = {};
          if (submissionData.fullName) updateFields.fullName = submissionData.fullName;
          if (submissionData.email) updateFields.email = submissionData.email;
          if (submissionData.mobileNumber) updateFields.phone = submissionData.mobileNumber;
          if (submissionData.permanentAddress) updateFields.address = submissionData.permanentAddress;
          if (Object.keys(updateFields).length > 0) {
            await api.put('/auth/me', updateFields);
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify({ ...user, ...updateFields }));
            }
          }
        } catch (profileError) {
          console.error('Failed to update user profile:', profileError);
        }
      }

      // Submit application
      // #region agent log
      const submissionDataKeys = Object.keys(submissionData);
      const submissionDataSample = {
        fullName: submissionData.fullName,
        hasPassport: submissionData.hasPassport,
        jobCategory: submissionData.jobCategory,
        experienceYears: submissionData.experienceYears,
        dateOfBirth: submissionData.dateOfBirth,
        gender: submissionData.gender,
        mobileNumber: submissionData.mobileNumber,
        email: submissionData.email,
        declaration: submissionData.declaration,
        digitalSignature: submissionData.digitalSignature?.length || 0,
      };
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1252',message:'Submitting application to API',data:{applicationId:applicationId || null,jobId:jobId || null,hasSubmissionData:!!submissionData,submissionId:submissionData.submissionId,submissionDataKeys,submissionDataSample},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const response = applicationId
        ? await api.put(`/applications/israel-skilled-worker/${applicationId}`, submissionData)
        : await api.post('/applications/israel-skilled-worker', submissionData);

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1257',message:'API response received',data:{success:response.data.success,hasData:!!response.data.data,responseId:response.data.data?.id || response.data.id,responseSubmissionId:response.data.data?.submissionId || response.data.submissionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const applicationResponse = response.data.data || response.data;
      const finalApplicationId = applicationResponse.id || applicationResponse.submissionId || applicationId;
      
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1262',message:'Application ID determined',data:{finalApplicationId,applicationResponseId:applicationResponse.id,applicationResponseSubmissionId:applicationResponse.submissionId,originalApplicationId:applicationId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Store application data for success page
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastApplicationData', JSON.stringify({
          ...applicationResponse,
          id: finalApplicationId,
          submissionId: submissionData.submissionId,
        }));
      }

      setSubmissionStatus({
        success: true,
        applicationId: finalApplicationId,
        message: t('form.messages.submissionSuccess') || 'Application submitted successfully! Your profile has been updated. Redirecting to Find Jobs...',
      });

      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1272',message:'Submission successful, setting redirect to Find Jobs',data:{finalApplicationId,redirectUrl:'/dashboard/worker?tab=find-jobs',timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Redirect to Find Jobs page (worker dashboard with Find Jobs tab) after showing success message
      setTimeout(() => {
        // #region agent log
        const valuesBeforeRedirect = getValues();
        fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1377',message:'Redirect timeout executing to Find Jobs',data:{finalApplicationId,hasWindow:typeof window !== 'undefined',hasLocation:typeof window !== 'undefined' && !!window.location,redirectUrl:'/dashboard/worker?tab=find-jobs',valuesBeforeRedirect:{fullName:valuesBeforeRedirect.fullName,hasPassport:valuesBeforeRedirect.hasPassport,workedAbroad:valuesBeforeRedirect.workedAbroad}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        if (typeof window !== 'undefined' && window.location) {
          // Redirect to worker dashboard Find Jobs tab (tab index 2)
          const redirectUrl = '/dashboard/worker?tab=find-jobs';
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1382',message:'Executing redirect to Find Jobs',data:{redirectUrl,currentUrl:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          window.location.href = redirectUrl;
        }
      }, 2000); // 2 second delay to show success message before redirect

      if (onSubmit) {
        onSubmit(applicationResponse);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      
      const errorData = error.response?.data;
      const submittedValues = getValues();
      
      // Check if error is due to missing required fields
      if (errorData?.missingFields && Array.isArray(errorData.missingFields)) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1320',message:'Backend validation failed - missing fields',data:{missingFields:errorData.missingFields,submittedValues:{fullName:submittedValues.fullName,hasPassport:submittedValues.hasPassport,jobCategory:submittedValues.jobCategory,experienceYears:submittedValues.experienceYears}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        // Server returned missing fields - navigate to first one
        navigateToFirstMissingField(errorData.missingFields);
        setSubmissionStatus({
          success: false,
          error: `${t('form.messages.requiredFields') || 'Please fill all required fields'}. Please complete the highlighted field.`,
        });
      } else {
        setSubmissionStatus({
          success: false,
          error: errorData?.message || error.message || t('form.messages.submissionError'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('form.personalDetails.title')}
          <Chip
            label={`Auto-Score: ${autoScore}/100`}
            color={autoScore >= 70 ? 'success' : autoScore >= 50 ? 'warning' : 'error'}
            size="small"
            sx={{ ml: 2 }}
          />
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="fullName"
          control={control}
          rules={{ 
            required: t('validation.required'),
            validate: (value) => {
              if (safeTrim(value) === '') {
                return t('validation.required');
              }
              return true;
            }
          }}
          render={({ field }) => (
            <TextField
              {...field}
              value={typeof field.value === 'string' ? field.value : (field.value || '')}
              onChange={(e) => {
                const newValue = e.target.value;
                field.onChange(newValue);
              }}
              fullWidth
              label={t('form.fields.fullName')}
              placeholder="e.g. Rajesh Kumar"
              helperText={errors.fullName?.message || t('form.fields.fullNameHelper')}
              error={!!errors.fullName}
              InputProps={{
                startAdornment: <Info color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="dateOfBirth"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                {...field}
                label={t('form.fields.dateOfBirth')}
                format="dd/MM/yyyy"
                maxDate={new Date()}
                minDate={new Date(1970, 0, 1)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.dateOfBirth,
                    helperText: t('form.fields.dateOfBirthHelper'),
                  }
                }}
              />
            </LocalizationProvider>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="gender"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>{t('form.fields.gender')}</InputLabel>
              <Select {...field} label={t('form.fields.gender')}>
                <MenuItem value="male">{t('form.options.male')}</MenuItem>
                <MenuItem value="female">{t('form.options.female')}</MenuItem>
                <MenuItem value="other">{t('form.options.other')}</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="maritalStatus"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.maritalStatus}>
              <InputLabel>{t('form.fields.maritalStatus')}</InputLabel>
              <Select {...field} label={t('form.fields.maritalStatus')}>
                <MenuItem value="single">{t('form.options.single')}</MenuItem>
                <MenuItem value="married">{t('form.options.married')}</MenuItem>
                <MenuItem value="divorced">{t('form.options.divorced')}</MenuItem>
                <MenuItem value="widowed">{t('form.options.widowed')}</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="mobileNumber"
          control={control}
          rules={{
            required: t('validation.required'),
            validate: (value) => {
              if (!value || safeTrim(value) === '') return t('validation.required');
              // Allow +91-9876543212, 9876543210, +1 234 567 8901 etc.: strip spaces/dashes, require 10–15 digits
              const digitsOnly = String(value).replace(/\D/g, '');
              if (digitsOnly.length < 10 || digitsOnly.length > 15) return t('validation.invalidPhone');
              return true;
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('form.fields.mobileNumber')}
              placeholder="e.g. +91-9876543210 or 9876543210"
              helperText={t('form.fields.mobileNumberHelper')}
              error={!!errors.mobileNumber}
              InputProps={{
                startAdornment: <WhatsApp color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="email"
          control={control}
          rules={{
            required: t('validation.required'),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t('validation.invalidEmail'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('form.fields.email')}
              placeholder="e.g. name@example.com"
              error={!!errors.email}
              InputProps={{
                startAdornment: <Email color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="permanentAddress"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={3}
              label={t('form.fields.permanentAddress')}
              placeholder="e.g. 123 Main Street, City, State, PIN"
              helperText={t('form.fields.permanentAddressHelper')}
              error={!!errors.permanentAddress}
              InputProps={{
                startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />
      </Grid>
    </Grid>
  );

  const renderPassportDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('form.passportDetails.title')}
          <Chip
            label={t('form.passportDetails.mandatory')}
            color="error"
            size="small"
            sx={{ ml: 2 }}
          />
        </Typography>
        {!watch('hasPassport') && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('form.passportDetails.warning') || 'A valid passport is required to proceed with the application'}
          </Alert>
        )}
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="hasPassport"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <FormControl component="fieldset" error={!!errors.hasPassport}>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                {t('form.fields.hasPassport')}
              </FormLabel>
              <RadioGroup
                name={field.name}
                row
                value={field.value != null && field.value !== '' ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <FormControlLabel value="yes" control={<Radio id={`hasPassport-yes`} name="hasPassport" />} label={t('form.options.yes')} />
                <FormControlLabel value="no" control={<Radio id={`hasPassport-no`} name="hasPassport" />} label={t('form.options.no')} />
              </RadioGroup>
              {errors.hasPassport && (
                <FormHelperText error>{errors.hasPassport.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      {watch('hasPassport') === 'no' && (
        <Grid item xs={12}>
          <Alert severity="error" sx={{ mt: 2 }}>
            {t('form.passportDetails.noPassportMessage')}
          </Alert>
        </Grid>
      )}

      {watch('hasPassport') === 'yes' && (
        <>
          <Grid item xs={12} md={6}>
            <Controller
              name="passportNumber"
              control={control}
              rules={{
                required: t('validation.required'),
                pattern: {
                  value: /^[A-Z0-9]{8,9}$/,
                  message: t('validation.invalidPassport'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('form.fields.passportNumber')}
                  placeholder="e.g. A12345678"
                  error={!!errors.passportNumber}
                  helperText={t('form.fields.passportNumberHelper')}
                  InputProps={{
                    startAdornment: <Flag color="action" sx={{ mr: 1 }} />,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="passportIssuePlace"
              control={control}
              rules={{ required: t('validation.required') }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('form.fields.passportIssuePlace')}
                  placeholder="e.g. New Delhi"
                  error={!!errors.passportIssuePlace}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="passportIssueDate"
              control={control}
              rules={{ required: t('validation.required') }}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    {...field}
                    label={t('form.fields.passportIssueDate')}
                    format="dd/MM/yyyy"
                    maxDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.passportIssueDate,
                      }
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="passportExpiryDate"
              control={control}
              rules={{ required: t('validation.required') }}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    {...field}
                    label={t('form.fields.passportExpiryDate')}
                    format="dd/MM/yyyy"
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.passportExpiryDate,
                        helperText: t('form.fields.passportExpiryHelper'),
                      }
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </Grid>
        </>
      )}
    </Grid>
  );

  const renderJobApplication = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('form.jobApplication.title')}
          <Chip
            label={t('form.jobApplication.autoRoute')}
            color="info"
            size="small"
            sx={{ ml: 2 }}
          />
        </Typography>
        {appliedJob && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Applying for: <strong>{appliedJob.title}{appliedJob.location ? ` - ${appliedJob.location}` : ''}</strong> (you can change category and trade below)
          </Typography>
        )}
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="jobCategory"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => {
            // Normalize value to match valid options
            const validValues = ['construction', 'caregiving', 'agriculture', 'manufacturing', 'hospitality', 'expert_specialist'];
            let normalizedValue = field.value || '';
            
            if (field.value && !validValues.includes(field.value)) {
              // Try to normalize the value
              const normalized = String(field.value).toLowerCase().replace(/\s+/g, '_');
              const categoryMap = {
                'construction': 'construction',
                'caregiving': 'caregiving',
                'care_giving': 'caregiving',
                'agriculture': 'agriculture',
                'manufacturing': 'manufacturing',
                'hospitality': 'hospitality',
                'expert_specialist': 'expert_specialist',
                'expert': 'expert_specialist',
                'specialist': 'expert_specialist',
              };
              normalizedValue = categoryMap[normalized] || '';
              
              // Update the field value if it was invalid (only if we found a valid mapping)
              if (normalizedValue && normalizedValue !== field.value) {
                // Use requestAnimationFrame to avoid React warnings about state updates during render
                requestAnimationFrame(() => {
                  setValue('jobCategory', normalizedValue, { shouldValidate: false, shouldDirty: false });
                });
              } else if (!normalizedValue) {
                // If we can't normalize, clear the value to avoid MUI error
                normalizedValue = '';
                requestAnimationFrame(() => {
                  setValue('jobCategory', '', { shouldValidate: false, shouldDirty: false });
                });
              }
            }
            
            return (
            <FormControl fullWidth error={!!errors.jobCategory}>
              <InputLabel>{t('form.fields.jobCategory')}</InputLabel>
              <Select 
                {...field} 
                value={normalizedValue} 
                label={t('form.fields.jobCategory')}
                onChange={(e) => {
                  field.onChange(e);
                }}
              >
                <MenuItem value="construction">{t('form.options.construction')}</MenuItem>
                <MenuItem value="caregiving">{t('form.options.caregiving')}</MenuItem>
                <MenuItem value="agriculture">{t('form.options.agriculture')}</MenuItem>
                <MenuItem value="manufacturing">{t('form.options.manufacturing')}</MenuItem>
                <MenuItem value="hospitality">{t('form.options.hospitality')}</MenuItem>
                <MenuItem value="expert_specialist">{t('form.options.expertSpecialist')}</MenuItem>
              </Select>
              <FormHelperText>{t('form.fields.jobCategoryHelper')}</FormHelperText>
            </FormControl>
            );
          }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="specificTrade"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('form.fields.specificTrade')}
              placeholder="e.g. Site Supervisor, Carpenter, Plumber"
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="experienceYears"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type="number"
              label={t('form.fields.experienceYears')}
              placeholder="e.g. 5"
              error={!!errors.experienceYears}
              InputProps={{
                inputProps: { min: 0, max: 50 },
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="workedAbroad"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <FormControl component="fieldset" error={!!errors.workedAbroad} fullWidth>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                {t('form.fields.workedAbroad')}
              </FormLabel>
              <RadioGroup
                name={field.name}
                row
                value={field.value != null && field.value !== '' ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <FormControlLabel value="yes" control={<Radio id={`workedAbroad-yes`} name="workedAbroad" />} label={t('form.options.yes')} />
                <FormControlLabel value="no" control={<Radio id={`workedAbroad-no`} name="workedAbroad" />} label={t('form.options.no')} />
              </RadioGroup>
              {errors.workedAbroad && (
                <FormHelperText error>{errors.workedAbroad.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      {watch('workedAbroad') === 'yes' && (
        <Grid item xs={12}>
          <Controller
            name="countriesWorked"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('form.fields.countriesWorked')}
                placeholder="e.g. UAE, Saudi Arabia"
                helperText="List countries where you have worked"
              />
            )}
          />
        </Grid>
      )}
    </Grid>
  );

  const renderSkills = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('form.sections.skills')}
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="hasCertificate"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <FormControl component="fieldset" error={!!errors.hasCertificate} fullWidth>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                {t('form.fields.hasCertificate')}
              </FormLabel>
              <RadioGroup
                name={field.name}
                row
                value={field.value != null && field.value !== '' ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <FormControlLabel value="yes" control={<Radio id={`hasCertificate-yes`} name="hasCertificate" />} label={t('form.options.yes')} />
                <FormControlLabel value="no" control={<Radio id={`hasCertificate-no`} name="hasCertificate" />} label={t('form.options.no')} />
              </RadioGroup>
              {errors.hasCertificate && (
                <FormHelperText error>{errors.hasCertificate.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      {watch('hasCertificate') === 'yes' && (
        <Grid item xs={12}>
          <Controller
            name="certificateDetails"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label={t('form.fields.certificateDetails')}
                placeholder="e.g. ITI Certificate in Carpentry, Safety Training"
              />
            )}
          />
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <Controller
          name="canReadDrawings"
          control={control}
          render={({ field }) => (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                {t('form.fields.canReadDrawings')}
              </FormLabel>
              <RadioGroup {...field} row value={field.value || ''} onChange={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1904',message:'canReadDrawings RadioGroup onChange',data:{fieldName:'canReadDrawings',newValue:e.target.value,currentValue:field.value,fieldNameProp:field.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                field.onChange(e);
              }}>
                <FormControlLabel value="yes" control={<Radio id={`canReadDrawings-yes`} name="canReadDrawings" />} label={t('form.options.yes')} />
                <FormControlLabel value="no" control={<Radio id={`canReadDrawings-no`} name="canReadDrawings" />} label={t('form.options.no')} />
              </RadioGroup>
            </FormControl>
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="languages"
          control={control}
          render={({ field }) => {
            // Ensure value is always an array for multiple select
            const value = Array.isArray(field.value) ? field.value : (field.value ? [field.value] : []);
            return (
            <FormControl fullWidth>
              <InputLabel>{t('form.fields.languages')}</InputLabel>
              <Select
                {...field}
                value={value}
                multiple
                label={t('form.fields.languages')}
                renderValue={(selected) => Array.isArray(selected) ? selected.join(', ') : ''}
                onChange={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:1982',message:'languages Select onChange',data:{fieldName:'languages',newValue:Array.isArray(e.target.value)?e.target.value:[e.target.value],currentValue:field.value,isArray:Array.isArray(field.value)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                  // #endregion
                  field.onChange(e.target.value);
                }}
              >
                <MenuItem value="hindi">Hindi</MenuItem>
                <MenuItem value="english">English</MenuItem>
                <MenuItem value="hebrew">Hebrew</MenuItem>
                <MenuItem value="arabic">Arabic</MenuItem>
                <MenuItem value="tamil">Tamil</MenuItem>
                <MenuItem value="telugu">Telugu</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            );
          }}
        />
      </Grid>
    </Grid>
  );

  const renderHealthLegal = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('form.sections.health')}
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Controller
          name="medicalCondition"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <FormControl component="fieldset" error={!!errors.medicalCondition} fullWidth>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                {t('form.fields.medicalCondition')}
              </FormLabel>
              <RadioGroup {...field} row value={field.value || ''} onChange={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:2012',message:'medicalCondition RadioGroup onChange',data:{fieldName:'medicalCondition',newValue:e.target.value,currentValue:field.value,fieldNameProp:field.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                field.onChange(e);
              }}>
                <FormControlLabel value="yes" control={<Radio id={`medicalCondition-yes`} name="medicalCondition" />} label={t('form.options.yes')} />
                <FormControlLabel value="no" control={<Radio id={`medicalCondition-no`} name="medicalCondition" />} label={t('form.options.no')} />
              </RadioGroup>
              {errors.medicalCondition && (
                <FormHelperText error>{errors.medicalCondition.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      {watch('medicalCondition') === 'yes' && (
        <Grid item xs={12}>
          <Controller
            name="medicalDetails"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label={t('form.fields.medicalDetails')}
                placeholder="e.g. None / Describe if any"
              />
            )}
          />
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <Controller
          name="criminalCase"
          control={control}
          rules={{ required: t('validation.required') }}
          render={({ field }) => (
            <FormControl component="fieldset" error={!!errors.criminalCase} fullWidth>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                {t('form.fields.criminalCase')}
              </FormLabel>
              <RadioGroup {...field} row value={field.value || ''} onChange={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'IsraelSkilledWorkerForm.js:2057',message:'criminalCase RadioGroup onChange',data:{fieldName:'criminalCase',newValue:e.target.value,currentValue:field.value,fieldNameProp:field.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                field.onChange(e);
              }}>
                <FormControlLabel value="yes" control={<Radio id={`criminalCase-yes`} name="criminalCase" />} label={t('form.options.yes')} />
                <FormControlLabel value="no" control={<Radio id={`criminalCase-no`} name="criminalCase" />} label={t('form.options.no')} />
              </RadioGroup>
              {errors.criminalCase && (
                <FormHelperText error>{errors.criminalCase.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      {watch('criminalCase') === 'yes' && (
        <Grid item xs={12}>
          <Controller
            name="criminalDetails"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label={t('form.fields.criminalDetails')}
                placeholder="e.g. None / Describe if any"
              />
            )}
          />
        </Grid>
      )}
    </Grid>
  );

  const renderDocuments = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('form.sections.documents')}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <FileUpload
          label="Passport Documents"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple={true}
          value={uploadedFiles.passportFiles}
          onChange={(files) => {
            setUploadedFiles((prev) => ({ ...prev, passportFiles: files }));
            setValue('passportFiles', files);
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <FileUpload
          label="Certificate Documents"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple={true}
          value={uploadedFiles.certificateFiles}
          onChange={(files) => {
            setUploadedFiles((prev) => ({ ...prev, certificateFiles: files }));
            setValue('certificateFiles', files);
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <FileUpload
          label="Work Photos"
          accept=".jpg,.jpeg,.png"
          multiple={true}
          value={uploadedFiles.workPhotos}
          onChange={(files) => {
            setUploadedFiles((prev) => ({ ...prev, workPhotos: files }));
            setValue('workPhotos', files);
          }}
        />
      </Grid>
    </Grid>
  );

  const renderDeclaration = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {t('form.sections.declaration')}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="declaration"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={field.value}
                />
              }
              label="I declare that all information provided is true and accurate to the best of my knowledge."
            />
          )}
        />
        {errors.declaration && (
          <Alert severity="error" sx={{ mt: 1 }}>
            You must accept the declaration to proceed
          </Alert>
        )}
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="digitalSignature"
          control={control}
          rules={{ 
            required: t('validation.required') || 'Digital signature is required',
            validate: (value) => safeTrim(value) !== '' || 'Please provide your digital signature'
          }}
          render={({ field }) => (
            <SignaturePad
              value={field.value}
              onChange={(signature) => {
                field.onChange(signature);
                setValue('digitalSignature', signature, { shouldValidate: true });
              }}
              label={t('form.fields.digitalSignature') || 'Digital Signature'}
              required={true}
            />
          )}
        />
        {errors.digitalSignature && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {errors.digitalSignature.message}
          </Alert>
        )}
      </Grid>
    </Grid>
  );

  // Render all steps but hide inactive ones so fields stay mounted and values persist (no blank on back/submit)
  const renderStepContent = () => (
    <>
      <Box sx={{ display: activeStep === 0 ? 'block' : 'none' }}>{renderPersonalDetails()}</Box>
      <Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>{renderPassportDetails()}</Box>
      <Box sx={{ display: activeStep === 2 ? 'block' : 'none' }}>{renderJobApplication()}</Box>
      <Box sx={{ display: activeStep === 3 ? 'block' : 'none' }}>{renderSkills()}</Box>
      <Box sx={{ display: activeStep === 4 ? 'block' : 'none' }}>{renderHealthLegal()}</Box>
      <Box sx={{ display: activeStep === 5 ? 'block' : 'none' }}>{renderDocuments()}</Box>
      <Box sx={{ display: activeStep === 6 ? 'block' : 'none' }}>{renderDeclaration()}</Box>
    </>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 3 }}>
      <LoadingOverlay open={loading} message="Submitting application..." />

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1">
              Israel Skilled Worker Application
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {showDemoButton && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={fillDemoData}
                  sx={{ whiteSpace: 'nowrap' }}
                  startIcon={<AutoAwesome />}
                >
                  Fill Demo Details
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => {
                    if (confirm('Clear all form data?')) {
                      window.location.reload();
                    }
                  }}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Clear Form
                </Button>
              )}
              <LanguageSelector />
            </Box>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {sections.map((section, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              return (
                <Step key={section.id} completed={isCompleted}>
                  <Box
                    component="span"
                    onClick={() => setActiveStep(index)}
                    sx={{
                      cursor: 'pointer',
                      '& .MuiStepLabel-label': {
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? 'primary.main' : 'text.secondary',
                      },
                    }}
                  >
                    <StepLabel
                      StepIconComponent={(props) => (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isActive ? 'primary.main' : isCompleted ? 'primary.light' : 'action.hover',
                            color: isActive || isCompleted ? 'primary.contrastText' : 'action.active',
                            fontWeight: 700,
                          }}
                        >
                          {isCompleted ? <CheckCircle fontSize="small" /> : section.icon}
                        </Box>
                      )}
                    >
                      {section.label}
                    </StepLabel>
                  </Box>
                </Step>
              );
            })}
          </Stepper>

          {submissionStatus && (
            <Alert
              severity={submissionStatus.success ? 'success' : 'error'}
              sx={{ mb: 3 }}
              onClose={() => setSubmissionStatus(null)}
            >
              {submissionStatus.message || submissionStatus.error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onFormSubmit, onFormInvalid)}>
            <Box sx={{ minHeight: '400px', mb: 3 }} data-step-content>
              {renderStepContent()}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, flexWrap: 'wrap', gap: 2 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<NavigateBefore />}
              >
                {t('form.buttons.back')}
              </Button>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep < sections.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<NavigateNext />}
                  >
                    {t('form.buttons.next')}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<Send />}
                    disabled={loading}
                  >
                    {t('form.buttons.submit')}
                  </Button>
                )}
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>

      <DocumentPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        document={previewDocument}
      />

      {/* Pre-submit: show completed form data for debugging */}
      <Dialog
        open={showSubmitPreview}
        onClose={() => { setShowSubmitPreview(false); setPendingSubmissionData(null); }}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Review before submit (debug)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Completed information that will be submitted. Check and confirm.
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: '60vh',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
            }}
          >
            {pendingSubmissionData && JSON.stringify(
              (() => {
                const copy = { ...pendingSubmissionData };
                if (typeof copy.digitalSignature === 'string' && copy.digitalSignature.length > 80) {
                  copy.digitalSignature = `[base64, ${copy.digitalSignature.length} chars]`;
                }
                return copy;
              })(),
              null,
              2
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setShowSubmitPreview(false); setPendingSubmissionData(null); }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const payload = pendingSubmissionData;
              setShowSubmitPreview(false);
              setPendingSubmissionData(null);
              if (payload) performSubmission(payload);
            }}
          >
            Confirm & Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IsraelSkilledWorkerForm;
