import Head from 'next/head';
import { Container, Typography, Box, Card, CardContent, Grid } from '@mui/material';
import { Security, PrivacyTip, DataUsage, Share, Lock, Cookie, Gavel, Update, ContactMail } from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';

const sections = [
  {
    title: 'Introduction',
    body: 'Apravas Consulting LLP ("we", "our", or "Apravas") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our recruitment platform and related services, including our website, job applications, and candidate portal.',
    icon: PrivacyTip,
  },
  {
    title: 'Information We Collect',
    body: 'We may collect information that you provide directly (e.g. name, email, phone, address, resume, work history, qualifications), information from your use of our services (e.g. IP address, device type, pages visited), and information from employers or partners in the recruitment process. We collect this information to facilitate recruitment, placements, and compliance with labour and immigration requirements.',
    icon: DataUsage,
  },
  {
    title: 'How We Use Your Information',
    body: 'We use your information to match you with job opportunities, process applications, communicate with you and with employers, maintain records for compliance and audits, improve our services, and send relevant updates where you have agreed. We do not sell your personal data to third parties for marketing.',
    icon: Security,
  },
  {
    title: 'Sharing and Disclosure',
    body: 'We may share your information with employers and authorised partners involved in recruitment, placement, or visa processing; with government or regulatory bodies when required by law; and with service providers who assist our operations under strict confidentiality. We require such parties to protect your data in line with applicable law.',
    icon: Share,
  },
  {
    title: 'Data Retention and Security',
    body: 'We retain your data for as long as necessary to fulfil the purposes in this policy and to comply with legal, regulatory, and contractual obligations. We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or misuse.',
    icon: Lock,
  },
  {
    title: 'Cookies and Similar Technologies',
    body: 'Our website may use cookies and similar technologies to improve functionality, remember your preferences, and analyse usage. You can manage cookie settings through your browser. Disabling certain cookies may affect some features of the site.',
    icon: Cookie,
  },
  {
    title: 'Your Rights',
    body: 'Depending on applicable law, you may have the right to access, correct, or delete your personal data, object to or restrict certain processing, and data portability. To exercise these rights or ask questions about your data, please contact us using the details below.',
    icon: Gavel,
  },
  {
    title: 'Updates to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the "Last updated" date. We encourage you to review this policy periodically.',
    icon: Update,
  },
  {
    title: 'Contact Us',
    body: 'For any privacy-related questions or requests, please contact us at the recruitment email configured in our platform, or via the Contact Us page. Apravas Consulting LLP — India-Israel recruitment and workforce mobility.',
    icon: ContactMail,
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Apravas Consulting LLP</title>
        <meta name="description" content="Privacy Policy for Apravas Consulting LLP — how we collect, use, and protect your information on our recruitment platform." />
      </Head>
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }} color="primary">
              Privacy Policy
            </Typography>
            <Typography color="text.secondary" maxWidth={720} mx="auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information when you use our recruitment platform and services.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Icon color="primary" />
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                          {section.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {section.body}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </MainLayout>
    </>
  );
}
