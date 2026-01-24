import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import IsraeliEmployerDashboard from '../../components/Dashboards/IsraeliEmployerDashboard';
import MainLayout from '../../components/Layout/MainLayout';

export default function EmployerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'employer') {
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
      <IsraeliEmployerDashboard />
    </MainLayout>
  );
}
