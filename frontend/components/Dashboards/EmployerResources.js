import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import {
  OpenInNew,
  ChevronRight,
  Description,
  Download,
  MenuBook,
  Dashboard,
  Work,
  People,
  Assessment,
  CheckCircle,
  PersonAddOutlined,
  Gavel,
  VerifiedUser,
} from '@mui/icons-material';
import api from '../../utils/api';
import DashboardShell from '../Layout/DashboardShell';

const GOVERNMENT_RESOURCES = [
  {
    label: 'eMigrate Portal',
    href: 'https://emigrate.gov.in/',
    description: 'India — emigration clearance & related services',
  },
  {
    label: 'PIBA Israel',
    href: 'https://www.gov.il/en/departments/population_and_immigration_authority/',
    description: 'Population and Immigration Authority',
  },
  {
    label: 'GDRFA Dubai',
    href: 'https://www.gdrfad.gov.ae/en',
    description: 'General Directorate of Residency and Foreigners Affairs',
  },
];

const TEMPLATE_FILES = [
  { label: 'Employment Contract', file: 'employment-contract-template.txt' },
  { label: 'Offer Letter', file: 'offer-letter-template.txt' },
  { label: 'Pre-Departure Checklist', file: 'pre-departure-checklist.txt' },
  { label: 'Medical Requirements', file: 'medical-requirements.txt' },
  { label: 'Visa Guide', file: 'visa-guide.txt' },
];

export default function EmployerResources() {
  const router = useRouter();
  const [shellUser, setShellUser] = useState({ display: '', role: 'employer' });
  const [dashboardData, setDashboardData] = useState(null);

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
        const res = await api.get('/dashboards/employer');
        if (!cancelled && res.data?.data) setDashboardData(res.data.data);
      } catch (_) {
        /* nav badges optional */
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
          { id: 8, label: 'Safety & Welfare', icon: <VerifiedUser /> },
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
    if (id === 8) {
      router.push('/dashboard/employer/safety');
      return;
    }
    router.push(id === 0 ? '/dashboard/employer' : `/dashboard/employer?tab=${id}`);
  };

  return (
    <DashboardShell
      navGroups={employerNavGroups}
      activeId={7}
      onNavSelect={handleNav}
      topbarTitle="Resources & Documentation"
      roleLabel={shellUser.role}
      userDisplayName={shellUser.display}
      onHome={() => router.push('/')}
      onLogout={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        fontWeight={800}
        sx={{ color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}
      >
        Resources & Documentation
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Official portals for compliance and ready-to-customise templates for your recruitment workflow.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid #e8eaf0',
              height: '100%',
              boxShadow: '0 2px 16px rgba(15, 23, 42, 0.06)',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: '#1e293b' }}>
                Government Resources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {GOVERNMENT_RESOURCES.map((item) => (
                  <Box
                    key={item.href}
                    component="a"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#e8f4fc',
                      border: '1px solid #c5e3f6',
                      textDecoration: 'none',
                      color: '#0f172a',
                      transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                      '&:hover': {
                        bgcolor: '#d7ebf9',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)',
                      },
                    }}
                  >
                    <OpenInNew sx={{ color: '#1565c0', fontSize: 22, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} fontSize="0.95rem">
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        {item.description}
                      </Typography>
                    </Box>
                    <ChevronRight sx={{ color: '#64748b', flexShrink: 0 }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid #e8eaf0',
              height: '100%',
              boxShadow: '0 2px 16px rgba(15, 23, 42, 0.06)',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5, color: '#1e293b' }}>
                Templates & Documents
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {TEMPLATE_FILES.map((item) => (
                  <Box
                    key={item.file}
                    component="a"
                    href={`/employer-resources/${item.file}`}
                    download
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e8eaf0',
                      textDecoration: 'none',
                      color: '#0f172a',
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: '#f1f5f9',
                        borderColor: '#e2e8f0',
                      },
                    }}
                  >
                    <Description sx={{ color: '#7c3aed', fontSize: 24, flexShrink: 0 }} />
                    <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>{item.label}</Typography>
                    <Download sx={{ color: '#64748b', fontSize: 22, flexShrink: 0 }} />
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Files are plain-text outlines. Replace with your legal-approved versions when ready.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardShell>
  );
}
