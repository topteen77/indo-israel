import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CircularProgress } from '@mui/material';
import WorkerDashboard from '../../components/Dashboards/WorkerDashboard';
import MainLayout from '../../components/Layout/MainLayout';

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { tab } = router.query || {};

  useEffect(() => {
    // Wait for router to be ready before checking auth
    if (!router.isReady) {
      return;
    }

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'worker') {
      router.push('/');
      return;
    }
    
    setLoading(false);
  }, [router.isReady, router]);

  if (loading || !router.isReady) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </div>
      </MainLayout>
    );
  }

  // Determine initial tab from query parameter
  const initialTab = tab === 'find-jobs' ? 2 : 0; // Tab 2 is "Find Jobs"

  return (
    <MainLayout>
      <WorkerDashboard initialTab={initialTab} />
    </MainLayout>
  );
}
