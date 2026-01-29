import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Chip,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Person,
  Assessment,
  Email,
  Phone,
  FileUpload,
  Cancel,
} from '@mui/icons-material';
import api from '../../utils/api';

const ActivityTimeline = ({ candidateId, applicationId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (candidateId || applicationId) {
      fetchActivities();
    }
  }, [candidateId, applicationId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/crm/activities?${candidateId ? `candidateId=${candidateId}` : `applicationId=${applicationId}`}`
      );
      if (response.data.success) {
        setActivities(response.data.data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      application_submitted: <FileUpload />,
      application_reviewed: <Assessment />,
      interview_scheduled: <Schedule />,
      interview_completed: <CheckCircle />,
      application_approved: <CheckCircle />,
      application_rejected: <Cancel />,
      email_sent: <Email />,
      phone_call: <Phone />,
      note_added: <Person />,
    };
    return icons[type] || <Person />;
  };

  const getActivityColor = (type) => {
    const colors = {
      application_submitted: 'primary',
      application_reviewed: 'info',
      interview_scheduled: 'warning',
      interview_completed: 'success',
      application_approved: 'success',
      application_rejected: 'error',
      email_sent: 'info',
      phone_call: 'info',
      note_added: 'default',
    };
    return colors[type] || 'default';
  };

  const formatActivityDescription = (activity) => {
    const descriptions = {
      application_submitted: 'Application submitted',
      application_reviewed: 'Application reviewed',
      interview_scheduled: 'Interview scheduled',
      interview_completed: 'Interview completed',
      application_approved: 'Application approved',
      application_rejected: 'Application rejected',
      email_sent: `Email sent: ${activity.details || ''}`,
      phone_call: `Phone call: ${activity.details || ''}`,
      note_added: `Note added: ${activity.details || ''}`,
    };
    return descriptions[activity.type] || activity.type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading activities...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Activity Timeline</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No activities recorded yet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Activity Timeline</Typography>
        <Box sx={{ mt: 2 }}>
          {activities.map((activity, index) => (
            <Box
              key={activity.id}
              sx={{
                display: 'flex',
                mb: 3,
                position: 'relative',
                '&::before': index < activities.length - 1 ? {
                  content: '""',
                  position: 'absolute',
                  left: 20,
                  top: 40,
                  bottom: -16,
                  width: 2,
                  bgcolor: 'divider',
                } : {},
              }}
            >
              <Avatar
                sx={{
                  bgcolor: `${getActivityColor(activity.type)}.main`,
                  width: 40,
                  height: 40,
                  mr: 2,
                }}
              >
                {getActivityIcon(activity.type)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  {formatActivityDescription(activity)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(activity.createdAt).toLocaleString()}
                </Typography>
                {activity.user && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    by {activity.user.name || activity.user.email}
                  </Typography>
                )}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
