import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  AutoAwesome,
  ContentCopy,
  Download,
  Gavel,
  PersonAddOutlined,
  Work,
  People,
  Assessment,
  CheckCircle,
  Dashboard,
  MenuBook,
} from '@mui/icons-material';
import api from '../../utils/api';
import DashboardShell from '../Layout/DashboardShell';

const DOC_FONT = '"Source Serif 4", "Libre Baskerville", Georgia, "Times New Roman", serif';
const DOC_BODY = '#334155';
const DOC_HEADING = '#1e1b4b';

function renderInlinePlaceholders(text) {
  const parts = String(text).split(/(\[[^\]\n]+\])/g);
  return parts.map((part, i) => {
    if (/^\[[^\]]+\]$/.test(part)) {
      return (
        <Box
          component="span"
          key={i}
          sx={{
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: '0.86em',
            fontWeight: 600,
            color: '#3730a3',
            bgcolor: '#eef2ff',
            px: 0.85,
            py: 0.2,
            borderRadius: '6px',
            border: '1px solid #c7d2fe',
            whiteSpace: 'nowrap',
          }}
        >
          {part}
        </Box>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/** Renders AI contract text as a readable document (not code / monospace block). */
function ContractDraftPreview({ text }) {
  const lines = text.split('\n');
  return (
    <Box sx={{ px: { xs: 2, sm: 3.5 }, py: { xs: 2.5, sm: 3.5 } }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') {
          return <Box key={i} sx={{ height: 12 }} />;
        }

        let clauseBody = trimmed;
        if (/^\*\*.+\*\*$/.test(trimmed)) {
          clauseBody = trimmed.slice(2, -2).trim();
        }

        const clauseMatch = clauseBody.match(/^(\d+)\.\s+(.+)$/);
        if (clauseMatch) {
          return (
            <Typography
              key={i}
              component="h3"
              sx={{
                fontFamily: DOC_FONT,
                fontWeight: 700,
                fontSize: { xs: '1.05rem', sm: '1.12rem' },
                color: DOC_HEADING,
                mt: i > 0 ? 3 : 0.5,
                mb: 1.5,
                pb: 1,
                borderBottom: '2px solid',
                borderColor: 'rgba(99, 102, 241, 0.22)',
                letterSpacing: '-0.015em',
                lineHeight: 1.35,
              }}
            >
              {clauseMatch[1]}. {renderInlinePlaceholders(clauseMatch[2])}
            </Typography>
          );
        }

        if (/^#{1,3}\s/.test(trimmed)) {
          const title = trimmed.replace(/^#{1,3}\s+/, '');
          return (
            <Typography
              key={i}
              sx={{
                fontFamily: DOC_FONT,
                fontWeight: 700,
                fontSize: '1.05rem',
                color: '#312e81',
                mt: 2.5,
                mb: 1,
              }}
            >
              {renderInlinePlaceholders(title)}
            </Typography>
          );
        }

        return (
          <Typography
            key={i}
            component="p"
            sx={{
              fontFamily: DOC_FONT,
              fontSize: '1rem',
              lineHeight: 1.88,
              color: DOC_BODY,
              mb: 1.4,
              maxWidth: '68ch',
              textAlign: 'left',
            }}
          >
            {renderInlinePlaceholders(line)}
          </Typography>
        );
      })}
    </Box>
  );
}

export default function EmployerContracts() {
  const router = useRouter();
  const [shellUser, setShellUser] = useState({ display: '', role: 'employer' });
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [draft, setDraft] = useState('');

  const [applicationId, setApplicationId] = useState('');
  const [jobId, setJobId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [salary, setSalary] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [contractDurationMonths, setContractDurationMonths] = useState('');
  const [probationMonths, setProbationMonths] = useState('');
  const [workingHours, setWorkingHours] = useState('Full-time, as per site schedule');
  const [annualLeaveDays, setAnnualLeaveDays] = useState('');
  const [noticePeriodDays, setNoticePeriodDays] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setShellUser({
        display: u.fullName || u.name || u.email || u.companyName || 'Employer',
        role: u.role || 'employer',
      });
    } catch (_) {
      setShellUser({ display: 'Employer', role: 'employer' });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dashRes, statusRes] = await Promise.all([
          api.get('/dashboards/employer'),
          api.get('/ai-contracts/status').catch(() => ({ data: { data: { aiAvailable: false } } })),
        ]);
        if (!cancelled && dashRes.data?.data) setDashboardData(dashRes.data.data);
        if (!cancelled && statusRes.data?.data) setAiAvailable(!!statusRes.data.data.aiAvailable);
      } catch (e) {
        if (!cancelled) setSnackbar({ open: true, message: 'Could not load dashboard', severity: 'error' });
      } finally {
        if (!cancelled) setLoadingDash(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const employerNavGroups = useMemo(() => {
    const activeJobs = dashboardData?.jobs?.activeJobs ?? 0;
    const pipeCount = (dashboardData?.pipeline?.candidates ?? []).length;
    return [
      {
        section: 'Employer',
        items: [
          { id: 0, label: 'Dashboard', icon: <Dashboard /> },
          { id: 1, label: 'Active Jobs', icon: <Work />, ...(activeJobs ? { badge: activeJobs } : {}) },
          { id: 2, label: 'Candidate Pipeline', icon: <People />, ...(pipeCount ? { badge: pipeCount } : {}) },
          { id: 3, label: 'Performance', icon: <Assessment /> },
          { id: 4, label: 'Compliance', icon: <CheckCircle /> },
          { id: 5, label: 'Register candidate', icon: <PersonAddOutlined /> },
          { id: 6, label: 'Contracts', icon: <Gavel /> },
          { id: 7, label: 'Resources', icon: <MenuBook /> },
        ],
      },
    ];
  }, [dashboardData]);

  const handleNav = (id) => {
    if (id === 5) {
      router.push('/dashboard/employer/register');
      return;
    }
    if (id === 6) {
      router.push('/dashboard/employer/contracts');
      return;
    }
    if (id === 7) {
      router.push('/dashboard/employer/resources');
      return;
    }
    router.push(id === 0 ? '/dashboard/employer' : `/dashboard/employer?tab=${id}`);
  };

  const jobs = dashboardData?.jobs?.jobs ?? [];
  const candidates = dashboardData?.pipeline?.candidates ?? [];

  const onSelectApplication = (id) => {
    setApplicationId(id);
    if (!id) return;
    const c = candidates.find((x) => String(x.id) === String(id));
    if (!c) return;
    setCandidateName(c.full_name || '');
    setCandidateEmail(c.email || '');
    setJobTitle(c.job_title || '');
    const job = jobs.find((j) => String(j.id) === String(c.job_id));
    if (job) {
      setJobId(String(job.id));
      setSalary(job.salary || '');
      setWorkLocation(job.location || '');
    }
  };

  const onSelectJobOnly = (id) => {
    setJobId(id);
    if (!id) {
      return;
    }
    const job = jobs.find((j) => String(j.id) === String(id));
    if (job) {
      setJobTitle(job.title || '');
      setSalary(job.salary || '');
      setWorkLocation(job.location || '');
    }
  };

  const handleGenerate = async () => {
    if (!aiAvailable) return;
    setGenerating(true);
    setDraft('');
    try {
      const payload = {
        employerCompany: dashboardData?.profile?.companyName || undefined,
        applicationId: applicationId || undefined,
        jobId: jobId || undefined,
        candidateName: candidateName.trim() || undefined,
        candidateEmail: candidateEmail.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        salary: salary.trim() || undefined,
        workLocation: workLocation.trim() || undefined,
        startDate: startDate || undefined,
        contractDurationMonths: contractDurationMonths === '' ? undefined : contractDurationMonths,
        probationMonths: probationMonths === '' ? undefined : probationMonths,
        workingHours: workingHours.trim() || undefined,
        annualLeaveDays: annualLeaveDays === '' ? undefined : annualLeaveDays,
        noticePeriodDays: noticePeriodDays === '' ? undefined : noticePeriodDays,
        additionalInstructions: additionalInstructions.trim() || undefined,
      };
      const res = await api.post('/ai-contracts/generate', payload);
      if (res.data?.success && res.data?.data?.contractText) {
        setDraft(res.data.data.contractText);
        setSnackbar({ open: true, message: 'Draft generated — review with legal counsel before use.', severity: 'success' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Generation failed';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'success' });
    } catch (_) {
      setSnackbar({ open: true, message: 'Could not copy', severity: 'error' });
    }
  };

  const downloadDraft = () => {
    if (!draft) return;
    const blob = new Blob([draft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employment-contract-draft-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell
      navGroups={employerNavGroups}
      activeId={6}
      onNavSelect={handleNav}
      topbarTitle="Contracts"
      roleLabel={shellUser.role}
      userDisplayName={shellUser.display}
      onHome={() => router.push('/')}
      onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      }}
    >
      <Box mb={2}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/employer')}
          sx={{ textTransform: 'none', color: 'text.secondary', mb: 1 }}
        >
          Back to dashboard
        </Button>
        <Typography variant="h4" component="h1" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
          AI contract drafts
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
          Build a first-draft employment or placement agreement from your job and candidate details. The model uses
          India–Israel recruitment context where relevant. This is{' '}
          <strong>not legal advice</strong> — have qualified counsel review and adapt before signing.
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
        Drafts are generated by AI for efficiency only. Apravas does not guarantee enforceability, compliance with PIBA /
        labour law, or suitability for your case.
      </Alert>

      {!aiAvailable ? (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          AI drafting is off until the server has a valid <code>OPENAI_API_KEY</code>. You can still prepare fields below;
          generation will work after configuration.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #e8eaf0' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Context
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Pull data from a pipeline applicant and/or job, then adjust terms before generating.
              </Typography>

              {loadingDash ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Pipeline application (optional)</InputLabel>
                      <Select
                        label="Pipeline application (optional)"
                        value={applicationId}
                        onChange={(e) => onSelectApplication(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>None — manual entry</em>
                        </MenuItem>
                        {candidates.map((c) => (
                          <MenuItem key={c.id} value={String(c.id)}>
                            {c.full_name} — {c.job_title}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Prefills worker name and role from your applicants</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Job posting (optional)</InputLabel>
                      <Select
                        label="Job posting (optional)"
                        value={jobId}
                        onChange={(e) => onSelectJobOnly(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {jobs.map((j) => (
                          <MenuItem key={j.id} value={String(j.id)}>
                            {j.title} — {j.location}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Worker full name"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Worker email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Job title / role"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Compensation"
                      placeholder="e.g. ₪ X / month gross"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Work location"
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Start date"
                      InputLabelProps={{ shrink: true }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Fixed term (months)"
                      inputProps={{ min: 0 }}
                      value={contractDurationMonths}
                      onChange={(e) => setContractDurationMonths(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Probation (months)"
                      inputProps={{ min: 0 }}
                      value={probationMonths}
                      onChange={(e) => setProbationMonths(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Annual leave (days)"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={annualLeaveDays}
                      onChange={(e) => setAnnualLeaveDays(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notice period (days)"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={noticePeriodDays}
                      onChange={(e) => setNoticePeriodDays(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Working hours"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={3}
                      label="Extra instructions for the AI"
                      placeholder="e.g. Include non-compete light touch; accommodation provided first 30 days…"
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={generating || !aiAvailable || !candidateName.trim() || !jobTitle.trim()}
                      startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                      onClick={handleGenerate}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.25,
                        bgcolor: '#5c3dc9',
                        '&:hover': { bgcolor: '#4a32a8' },
                      }}
                    >
                      {generating ? 'Generating draft…' : 'Generate contract with AI'}
                    </Button>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid #e8eaf0',
              minHeight: 420,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 0, '&:last-child': { pb: 0 } }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  bgcolor: '#fafbfc',
                  borderBottom: '1px solid #eef0f4',
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Draft preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    Readable layout · placeholders highlighted · not a final legal document
                  </Typography>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    disabled={!draft}
                    onClick={copyDraft}
                    sx={{
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      color: '#475569',
                      '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Download />}
                    disabled={!draft}
                    onClick={downloadDraft}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#5c3dc9',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#4c32a8', boxShadow: 'none' },
                    }}
                  >
                    Download .txt
                  </Button>
                </Box>
              </Box>
              {draft ? (
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    maxHeight: { xs: '55vh', lg: 'calc(100vh - 240px)' },
                    bgcolor: '#fdfcfa',
                    backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #faf8f5 48%, #f7f5f2 100%)',
                    '&::-webkit-scrollbar': { width: 10 },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#cbd5e1',
                      borderRadius: 5,
                      border: '2px solid #fdfcfa',
                    },
                    '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
                  }}
                >
                  <Box
                    sx={{
                      height: 4,
                      background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 45%, #a855f7 100%)',
                      opacity: 0.85,
                    }}
                  />
                  <Box
                    sx={{
                      maxWidth: 720,
                      my: { xs: 1, sm: 2 },
                      mx: { xs: 1.5, sm: 'auto' },
                      borderRadius: 2,
                      bgcolor: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 12px 40px -12px rgba(15, 23, 42, 0.12)',
                      border: '1px solid rgba(226, 232, 240, 0.9)',
                    }}
                  >
                    <ContractDraftPreview text={draft} />
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    py: 10,
                    px: 2,
                    bgcolor: '#fafbfc',
                  }}
                >
                  <Typography variant="body2" align="center" sx={{ maxWidth: 320 }}>
                    Generated text will appear here as a formatted document. Enter worker name and job title, then run the
                    generator.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardShell>
  );
}
