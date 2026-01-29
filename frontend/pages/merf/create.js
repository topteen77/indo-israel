import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import MainLayout from '../../components/Layout/MainLayout';

const MERFForm = dynamic(
  () => import('../../components/MERF/MERFForm'),
  { ssr: false }
);

export default function CreateMERFPage() {
  const router = useRouter();
  const { templateId } = router.query;

  const handleSuccess = (requisitionData) => {
    router.push(`/merf/success?requisitionId=${requisitionData.id}`);
  };

  return (
    <MainLayout>
      <MERFForm templateId={templateId} onSuccess={handleSuccess} mode="create" />
    </MainLayout>
  );
}
