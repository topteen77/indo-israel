import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DashboardPageFrame from '../../../components/Layout/DashboardPageFrame';
import DashboardShell from '../../../components/Layout/DashboardShell';
import { buildWorkerDashboardNavGroups } from '../../../config/workerDashboardNav';

export default function WorkerAparavasAgentPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [shellUser, setShellUser] = useState({ display: '', role: 'worker' });

  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'worker') {
      router.push('/');
      return;
    }

    try {
      setShellUser({
        display: user.fullName || user.name || user.email || 'Worker',
        role: user.role || 'worker',
      });
    } catch (_) {
      setShellUser({ display: 'Worker', role: 'worker' });
    }
    setLoading(false);
  }, [router.isReady, router]);

  const workerNavGroups = useMemo(() => buildWorkerDashboardNavGroups(t), [t]);

  const handleNavSelect = (id) => {
    if (id === 8) return;
    if (id === 2) {
      router.push('/dashboard/worker?tab=find-jobs');
      return;
    }
    router.push(`/dashboard/worker?tab=${id}`);
  };

  const shellProps = {
    navGroups: workerNavGroups,
    activeId: 8,
    onNavSelect: handleNavSelect,
    topbarTitle: t('common.aiDocumentIntake', 'AI Document Intake'),
    roleLabel: shellUser.role,
    userDisplayName: shellUser.display,
    onHome: () => router.push('/'),
    onLogout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    },
  };

  if (loading || !router.isReady) {
    return (
      <DashboardPageFrame>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardPageFrame>
    );
  }

  return (
    <DashboardPageFrame>
      <DashboardShell {...shellProps}>
        <Box
          sx={{
            width: '100%',
            height: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 180px)' },
            minHeight: 480,
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid #e8eaf0',
            bgcolor: '#fff',
          }}
        >
          <iframe
            title={t('common.aiDocumentIntake', 'Aparavas AI Document Intake')}
            src="/aparavas-agent.html"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </Box>
      </DashboardShell>
    </DashboardPageFrame>
  );
}
