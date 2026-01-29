import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import MainLayout from '../../components/Layout/MainLayout';

const IsraelSkilledWorkerForm = dynamic(
  () => import('../../components/Applications/IsraelSkilledWorkerForm'),
  { ssr: false }
);

export default function ApplyPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const handleSubmit = (data) => {
    console.log('Application submitted:', data);
    // Form component will handle redirect to success page
  };

  return (
    <MainLayout>
      <IsraelSkilledWorkerForm
        jobId={router.isReady ? jobId : null}
        onSubmit={handleSubmit}
        mode="create"
      />
    </MainLayout>
  );
}
