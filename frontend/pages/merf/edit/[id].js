import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/Layout/MainLayout';

const MERFForm = dynamic(
  () => import('../../../components/MERF/MERFForm'),
  { ssr: false }
);

export default function EditMERFPage() {
  const router = useRouter();
  const { id } = router.query;

  const handleSuccess = (requisitionData) => {
    router.push(`/merf/view/${id}`);
  };

  return (
    <MainLayout>
      <MERFForm requisitionId={id} onSuccess={handleSuccess} mode="edit" />
    </MainLayout>
  );
}
