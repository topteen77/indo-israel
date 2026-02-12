import Head from 'next/head';
import { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardContent, MenuItem, Accordion, AccordionSummary, AccordionDetails, Alert, CircularProgress } from '@mui/material';
import { LocationOn, Phone, Email, ExpandMore, Help, CheckCircle } from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';
import api from '../utils/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+()]{10,20}$/;

const FAQ_ITEMS = [
  {
    question: 'How long does the placement process usually take?',
    answer: 'Typical timelines vary, but many placements complete within 6–12 weeks from selection to departure depending on visa and destination.',
  },
  {
    question: 'Do you assist with visa and documentation?',
    answer: 'Yes — we coordinate documentation, medical checks and visa processing with partner agencies to streamline travel and reduce delays.',
  },
  {
    question: 'Is there pre-departure training?',
    answer: 'We offer cultural orientation, basic language support and job-specific briefings to prepare candidates for overseas assignments.',
  },
];

function validateForm(form) {
  const errors = {};
  const name = (form.name || '').trim();
  const email = (form.email || '').trim();
  const phone = (form.phone || '').trim();
  const message = (form.message || '').trim();

  if (!name) {
    errors.name = 'Full name is required';
  } else if (name.length < 2) {
    errors.name = 'Please enter at least 2 characters';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = 'Please enter a valid phone number (10–20 digits)';
  }

  return errors;
}

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/email/contact-enquiry', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        message: form.message.trim(),
      });
      setForm({ name: '', email: '', phone: '', country: '', message: '' });
      setSubmittedSuccess(true);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send enquiry. Please try again later.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <>
      <Head>
        <title>Contact Us — Apravas Consulting LLP</title>
        <meta name="description" content="General enquiry — contact Apravas Consulting for recruitment, visas and workforce solutions." />
      </Head>
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              General Enquiry
            </Typography>
            <Typography color="text.secondary" maxWidth={720} mx="auto">
              Have a question or need support? Fill out the form below, and our team will get back to you as soon as possible.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  {submittedSuccess ? (
                    <Alert
                      severity="success"
                      icon={<CheckCircle />}
                      sx={{ borderRadius: 2 }}
                    >
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Thank you for your enquiry
                      </Typography>
                      <Typography variant="body2">
                        Your message has been received. Our team will get back to you as soon as possible.
                      </Typography>
                      <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => setSubmittedSuccess(false)}>
                        Send another message
                      </Button>
                    </Alert>
                  ) : (
                    <>
                      <Typography variant="h6" color="primary" gutterBottom>Send us a Message</Typography>
                      {submitError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSubmitError('')}>
                          {submitError}
                        </Alert>
                      )}
                      <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Full name *"
                              value={form.name}
                              onChange={(e) => handleChange('name', e.target.value)}
                              error={Boolean(errors.name)}
                              helperText={errors.name}
                              inputProps={{ 'aria-invalid': Boolean(errors.name) }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              type="email"
                              label="Email *"
                              value={form.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              error={Boolean(errors.email)}
                              helperText={errors.email}
                              inputProps={{ 'aria-invalid': Boolean(errors.email) }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Phone number"
                              placeholder="e.g. +91 98765 43210"
                              value={form.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                              error={Boolean(errors.phone)}
                              helperText={errors.phone}
                              inputProps={{ 'aria-invalid': Boolean(errors.phone) }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              select
                              label="Country"
                              value={form.country}
                              onChange={(e) => handleChange('country', e.target.value)}
                            >
                              <MenuItem value="">Select country</MenuItem>
                              <MenuItem value="India">India</MenuItem>
                              <MenuItem value="United Arab Emirates">United Arab Emirates</MenuItem>
                              <MenuItem value="Qatar">Qatar</MenuItem>
                              <MenuItem value="Saudi Arabia">Saudi Arabia</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={6}
                              label="Message"
                              value={form.message}
                              onChange={(e) => handleChange('message', e.target.value)}
                              error={Boolean(errors.message)}
                              helperText={errors.message}
                              inputProps={{ 'aria-invalid': Boolean(errors.message) }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              type="submit"
                              variant="contained"
                              size="large"
                              sx={{ borderRadius: 2 }}
                              disabled={submitting}
                              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                              {submitting ? 'Sending…' : 'Submit Enquiry'}
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>Our Location & Contact</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <LocationOn color="primary" />
                    <Box>
                      <Typography fontWeight={600}>Apravas Consulting LLP</Typography>
                      <Typography variant="body2" color="text.secondary">SCO 80-81, First Floor, Sector - 17-D, Chandigarh, India</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Phone color="primary" />
                    <Box>
                      <Typography fontWeight={600}>Phone</Typography>
                      <Typography variant="body2" color="text.secondary">+91 98766 12499</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Email color="primary" />
                    <Box>
                      <Typography fontWeight={600}>Email</Typography>
                      <Typography variant="body2" color="text.secondary">info@apravas.com</Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" gutterBottom>Office Hours</Typography>
                  <Typography variant="body2" color="text.secondary">Mon — Fri: 9:00 AM — 6:00 PM</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Help color="primary" />
              Frequently Asked Questions
            </Typography>
            {FAQ_ITEMS.map((item, index) => (
              <Accordion key={index} variant="outlined" sx={{ borderRadius: 1, '&:before': { display: 'none' }, mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight={500}>{item.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{item.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </MainLayout>
    </>
  );
}
