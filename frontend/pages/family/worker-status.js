import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/Layout/MainLayout';
import FamilyPortal from '../../components/Safety/FamilyPortal';

export default function FamilyWorkerStatusPage() {
  const router = useRouter();
  const [workerId, setWorkerId] = useState(null);

  useEffect(() => {
    // Get worker ID from query params or localStorage
    const { id } = router.query;
    const storedId = localStorage.getItem('family_worker_id');
    setWorkerId(id || storedId || '1');
  }, [router.query]);

  return (
    <MainLayout>
      <FamilyPortal workerId={workerId} />
    </MainLayout>
  );
}
