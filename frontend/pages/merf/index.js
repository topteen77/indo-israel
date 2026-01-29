import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Add,
  Business,
  Visibility,
  Edit,
  CheckCircle,
  Schedule,
  Cancel,
} from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';
import api from '../../utils/api';

export default function MERFListPage() {
  const router = useRouter();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.get(`/merf/requisitions?employerId=${user.id}`);
      if (response.data.success) {
        setRequisitions(response.data.data.requisitions || []);
      }
    } catch (err) {
      console.error('Error fetching requisitions:', err);
      setError('Failed to load requisitions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'info',
      under_review: 'warning',
      approved: 'success',
      rejected: 'error',
      active: 'success',
      completed: 'info',
    };
    return colors[status] || 'default';
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

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business />
            MERF Requisitions
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/merf/create')}
          >
            Create New MERF
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {requisitions.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Business sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No MERF Requisitions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first MERF requisition to request workers
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push('/merf/create')}
              >
                Create MERF Requisition
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Requisition Number</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Job Category</TableCell>
                    <TableCell>Workers</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requisitions.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {req.requisitionNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{req.title}</TableCell>
                      <TableCell>
                        <Chip label={req.jobCategory} size="small" />
                      </TableCell>
                      <TableCell>{req.numberOfWorkers}</TableCell>
                      <TableCell>
                        <Chip
                          label={req.status}
                          color={getStatusColor(req.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/merf/view/${req.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                        {req.status === 'draft' && (
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/merf/edit/${req.id}`)}
                          >
                            <Edit />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </Container>
    </MainLayout>
  );
}
