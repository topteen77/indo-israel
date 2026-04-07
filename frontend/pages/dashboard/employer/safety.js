import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardPageFrame from '../../../components/Layout/DashboardPageFrame';
import EmployerSafetyPage from '../../../components/Safety/EmployerSafetyPage';

export default function EmployerSafetyRoute() {
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
    <DashboardPageFrame>
      <EmployerSafetyPage />
    </DashboardPageFrame>
  );
}
