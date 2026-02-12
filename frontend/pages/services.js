import Head from 'next/head';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { CheckCircle, Search, Assessment, Rocket, Description, Shield, LocalShipping } from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';

const serviceCards = [
  { id: 'sourcing', icon: Search, title: 'Workforce Sourcing & Screening', desc: 'We source skilled candidates from trusted talent pools and screen them using competency-based interviews, background checks and employer-fit evaluation to reduce hiring risk.', items: ['Targeted talent search', 'Pre-employment screening & background checks', 'Video interviews & reference validation'] },
  { id: 'assessments', icon: Assessment, title: 'Trade Skill Assessments', desc: 'Practical and certified assessments for trade and technical roles to ensure candidates meet job-specific performance standards before placement.', items: ['Hands-on practical tests', 'Skill verification reports', 'Training gap analysis'] },
  { id: 'deployment', icon: Rocket, title: 'Employer Workforce Deployment', desc: 'From offer management to onboarding, we coordinate employer engagement, placement timelines and post-deployment support to ensure smooth workforce absorption.', items: ['Offer & contract facilitation', 'Onboarding coordination', 'Post-assignment follow-up'] },
  { id: 'documentation', icon: Description, title: 'Documentation & Visa Coordination', desc: 'End-to-end documentation, medical checks and visa processing with local partners to reduce delays and ensure legal entry and employment.', items: ['Document verification & attestation', 'Visa application support', 'Pre-departure orientation'] },
  { id: 'compliance', icon: Shield, title: 'Regulatory Compliance Management', desc: 'We maintain a regulation-first approach across source and destination countries to protect workers and shield employers from legal risk.', items: ['Labour law and licensing advisory', 'Employment contract compliance', 'Audit-ready record keeping'] },
  { id: 'logistics', icon: LocalShipping, title: 'Cross-border Workforce Logistics', desc: 'Comprehensive logistics including travel, arrival support and local transfers so candidates arrive safe, ready and on-time.', items: ['Travel and arrival coordination', 'Accommodation & local transport setup', '24/7 helpline during relocation'] },
];

const steps = [
  { n: 1, title: 'Define Needs', text: 'We map role requirements, employer standards and regulatory constraints to build a precise scope.' },
  { n: 2, title: 'Source & Assess', text: 'Screen, test and verify candidate skills and fit for the role using practical assessments.' },
  { n: 3, title: 'Deploy & Support', text: 'Manage documentation, visas and logistics until the candidate is onboarded overseas.' },
  { n: 4, title: 'Monitor & Improve', text: 'Ongoing compliance checks, employer feedback and worker welfare monitoring to improve outcomes.' },
];

export default function Services() {
  return (
    <>
      <Head>
        <title>Services — Apravas Consulting LLP</title>
        <meta name="description" content="End-to-end international recruitment services: sourcing, skill assessments, deployment, visas, compliance and logistics." />
      </Head>
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 4, alignItems: 'center', mb: 5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                End-to-end International Recruitment Services
              </Typography>
              <Typography color="text.secondary">
                We manage the entire recruitment lifecycle — from sourcing skilled candidates to compliant cross-border deployment — so employers can scale their workforce confidently and candidates can move safely for better opportunities.
              </Typography>
            </Box>
            <Box sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
              <Box component="img" src="/images/trade-skills-assessment.jpg" alt="Apravas services" sx={{ width: '100%', borderRadius: 2, display: 'block' }} />
            </Box>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>Our Services</Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {serviceCards.map((s) => {
              const Icon = s.icon;
              return (
                <Grid item xs={12} md={6} key={s.id}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Icon color="primary" />
                        <Typography variant="h6" color="primary">{s.title}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{s.desc}</Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {s.items.map((item, i) => (
                          <Box key={i} component="li" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                            <CheckCircle sx={{ color: 'primary.main', fontSize: 18 }} />
                            <Typography variant="body2">{item}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 5 }}>Our Process</Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {steps.map((step) => (
              <Grid item xs={12} sm={6} md={3} key={step.n}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, mb: 1 }}>{step.n}</Box>
                    <Typography variant="subtitle1" fontWeight={600}>{step.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{step.text}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </MainLayout>
    </>
  );
}
