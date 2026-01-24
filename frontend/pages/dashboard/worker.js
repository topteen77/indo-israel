import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import WorkerDashboard from '../../components/Dashboards/WorkerDashboard';
import MainLayout from '../../components/Layout/MainLayout';

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'worker') {
      router.push('/');
      return;
    }
    
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <MainLayout>
      <WorkerDashboard />
    </MainLayout>
  );
}
