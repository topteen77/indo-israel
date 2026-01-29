import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

const IsraelSkilledWorkerForm = dynamic(
  () => import('../../components/Applications/IsraelSkilledWorkerForm'),
  { ssr: false }
);

export default function ApplyPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isJobId, setIsJobId] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for router to be ready before checking ID type
    if (!router.isReady) {
      return;
    }

    if (id) {
      // Check if ID is a job ID or application ID
      // Job IDs are numeric, application IDs might be like "app-123" or "ISR-..."
      const checkIdType = async () => {
        try {
          // Try to fetch as job first (job IDs are numeric)
          if (!isNaN(id)) {
            const jobResponse = await api.get(`/jobs/${id}`);
            if (jobResponse.data.success) {
              setIsJobId(true);
              setLoading(false);
              return;
            }
          }
          // Not a job ID, assume it's an application ID
          setIsJobId(false);
        } catch (error) {
          // If job fetch fails, it's likely an application ID
          setIsJobId(false);
        } finally {
          setLoading(false);
        }
      };
      checkIdType();
    } else {
      setLoading(false);
    }
  }, [router.isReady, id, router]);

  const handleSubmit = (data) => {
    if (isJobId) {
      console.log('Application submitted for job:', id, data);
      // Form component will handle redirect to success page
    } else {
      console.log('Application updated:', data);
      router.push('/dashboard/worker');
    }
  };

  if (loading || !router.isReady) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          Loading...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <IsraelSkilledWorkerForm
        applicationId={isJobId ? null : id}
        jobId={isJobId ? id : null}
        onSubmit={handleSubmit}
        mode={isJobId ? 'create' : 'edit'}
      />
    </MainLayout>
  );
}
