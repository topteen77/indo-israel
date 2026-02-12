import Head from 'next/head';
import { Box, Container, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';

const values = [
  'Integrity in recruitment',
  'Transparency in communication',
  'Respect for worker rights',
  'Compliance-first operations',
  'Long-term partnerships',
];

export default function AboutUs() {
  return (
    <>
      <Head>
        <title>About Apravas Consulting LLP</title>
        <meta name="description" content="Apravas Consulting LLP — ethical global employment, compliant manpower solutions, and workforce mobility from India to overseas opportunities." />
      </Head>
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 4, alignItems: 'center', mb: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                About Apravas Consulting LLP
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Apravas Consulting LLP is an international recruitment and workforce mobility organisation
                focused on delivering compliant, structured and scalable manpower solutions. Our mission is to enable
                ethical global employment by connecting skilled Indian professionals with legitimate overseas
                opportunities while ensuring regulatory compliance, transparency and worker protection.
              </Typography>
              <Button variant="contained" href="/contact-us" sx={{ borderRadius: 2 }}>
                Get in touch
              </Button>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {['Compliant – Regulation-first approach', 'Transparent – Clear communication', 'Worker-first – Rights & protection'].map((item, i) => (
                  <Grid item xs={12} sm={4} key={i}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="body2" color="primary" fontWeight={600}>{item.split(' – ')[0]}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.split(' – ')[1]}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box sx={{ width: { xs: '100%', md: 384 }, flexShrink: 0 }}>
              <Box component="img" src="/images/apravas-about-us.jpg" alt="Apravas" sx={{ width: '100%', borderRadius: 2, display: 'block' }} />
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>Our Vision</Typography>
                  <Typography color="text.secondary">
                    To become a globally respected manpower mobility partner recognized for integrity, compliance, and
                    sustainable workforce solutions. We aim to build long-term, ethical partnerships that protect workers
                    and deliver measurable outcomes for employers.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>Our Core Values</Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {values.map((v, i) => (
                      <Box key={i} component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <CheckCircle sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body2">{v}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined" sx={{ mt: 4, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Ready to partner with Apravas?</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Contact us to discuss compliant workforce solutions and overseas placement opportunities.
              </Typography>
              <Button variant="contained" href="mailto:info@apravas.com" sx={{ mr: 1, borderRadius: 2 }}>Email Us</Button>
              <Button variant="outlined" href="/contact-us" sx={{ borderRadius: 2 }}>Request a Consultation</Button>
            </CardContent>
          </Card>
        </Container>
      </MainLayout>
    </>
  );
}
