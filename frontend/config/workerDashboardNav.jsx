import React from 'react';
import {
  Assessment,
  Work,
  School,
  GetApp,
  VerifiedUser,
  Person,
  Timeline,
} from '@mui/icons-material';
import AutoAwesome from '@mui/icons-material/AutoAwesome';

/** Shared worker sidebar items (ids 0–7 = in-dashboard tabs; 8 = separate AI agent route). */
export function buildWorkerDashboardNavGroups(t) {
  return [
    {
      section: t('common.workspace', 'Workspace'),
      items: [
        { id: 0, label: t('common.overview', 'Overview'), icon: <Assessment /> },
        { id: 1, label: t('common.myApplications', 'My Applications'), icon: <Work /> },
        { id: 2, label: t('common.findJobs', 'Find Jobs'), icon: <Work /> },
        { id: 3, label: t('common.documents', 'Documents'), icon: <GetApp /> },
        { id: 4, label: t('common.skillsLearning', 'Skills & Learning'), icon: <School /> },
        { id: 5, label: t('common.safetyWelfare', 'Safety & Welfare'), icon: <VerifiedUser /> },
        { id: 6, label: t('common.myProfile', 'My Profile'), icon: <Person /> },
        { id: 7, label: t('common.timeline', 'Timeline'), icon: <Timeline /> },
        {
          id: 8,
          label: t('common.aiDocumentIntake', 'AI Document Intake'),
          icon: <AutoAwesome />,
        },
      ],
    },
  ];
}
