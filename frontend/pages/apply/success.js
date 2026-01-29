import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/Layout/MainLayout';
import ApplicationConfirmation from '../../components/Applications/ApplicationConfirmation';
import { Box, CircularProgress, Alert } from '@mui/material';
import api from '../../utils/api';

export default function ApplicationSuccessPage() {
  const router = useRouter();
  const { applicationId } = router.query;
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:14',message:'Success page useEffect',data:{routerReady:router.isReady,applicationId:applicationId || null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (router.isReady) {
      // Try to get application data from localStorage (set during submission)
      const storedData = localStorage.getItem('lastApplicationData');
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:18',message:'Checking localStorage for application data',data:{hasStoredData:!!storedData,applicationId:applicationId || null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:22',message:'Loaded application data from localStorage',data:{hasData:!!data,dataId:data.id || data.submissionId || null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          setApplicationData(data);
          setLoading(false);
          // Clear stored data after use
          localStorage.removeItem('lastApplicationData');
        } catch (e) {
          console.error('Error parsing stored application data:', e);
          // #region agent log
          fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:28',message:'Error parsing localStorage data',data:{error:e.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          setError('Failed to load application data');
          setLoading(false);
        }
      } else if (applicationId) {
        // If applicationId is provided, fetch from API
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:33',message:'Fetching application data from API',data:{applicationId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        fetchApplicationData(applicationId);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:36',message:'No application data found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setError('No application data found');
        setLoading(false);
      }
    }
  }, [router.isReady, applicationId]);

  const fetchApplicationData = async (id) => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:55',message:'fetchApplicationData called',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      const response = await api.get(`/applications/israel-skilled-worker/${id}`);
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:58',message:'API response received in success page',data:{success:response.data.success,hasData:!!response.data.data,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (response.data.success) {
        setApplicationData(response.data.data || response.data);
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:61',message:'Application data set successfully',data:{hasApplicationData:!!(response.data.data || response.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } else {
        setError('Application not found');
      }
    } catch (err) {
      console.error('Error fetching application:', err);
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/665a1034-c285-4edd-9327-1dafbad3fa06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apply/success.js:68',message:'Error fetching application data',data:{error:err.message,status:err.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setError('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ApplicationConfirmation applicationData={applicationData} />
    </MainLayout>
  );
}
