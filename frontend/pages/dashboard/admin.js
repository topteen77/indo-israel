import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ApravasAdminDashboard from '../../components/Dashboards/ApravasAdminDashboard';
import MainLayout from '../../components/Layout/MainLayout';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const tabParam = router.query.tab;
  const initialTab = tabParam !== undefined ? parseInt(String(tabParam), 10) : undefined;
  const tabIndex = Number.isFinite(initialTab) && initialTab >= 0 ? initialTab : undefined;

  return (
    <MainLayout>
      <ApravasAdminDashboard initialTab={tabIndex} />
    </MainLayout>
  );
}
