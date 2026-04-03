import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import EmployerRegisterCandidate from '../../../components/Dashboards/EmployerRegisterCandidate';
import DashboardPageFrame from '../../../components/Layout/DashboardPageFrame';

export default function EmployerRegisterPage() {
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
      <EmployerRegisterCandidate />
    </DashboardPageFrame>
  );
}
