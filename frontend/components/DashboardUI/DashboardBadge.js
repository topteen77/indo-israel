import React from 'react';
import { Box, Typography } from '@mui/material';

const colorMap = {
  green: { fg: '#16a34a', bg: 'rgba(22,163,74,0.10)', bd: 'rgba(22,163,74,0.22)' },
  blue: { fg: '#667eea', bg: 'rgba(102,126,234,0.12)', bd: 'rgba(102,126,234,0.22)' },
  violet: { fg: '#7B0FF5', bg: 'rgba(123,15,245,0.10)', bd: 'rgba(123,15,245,0.22)' },
  gold: { fg: '#d97706', bg: 'rgba(217,119,6,0.10)', bd: 'rgba(217,119,6,0.22)' },
  coral: { fg: '#ef4444', bg: 'rgba(239,68,68,0.10)', bd: 'rgba(239,68,68,0.22)' },
  gray: { fg: '#64748b', bg: 'rgba(100,116,139,0.10)', bd: 'rgba(148,163,184,0.35)' },
};

export default function DashboardBadge({ label, tone = 'gray', startIcon = null }) {
  const c = colorMap[tone] || colorMap.gray;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.1,
        py: 0.35,
        borderRadius: 999,
        border: `1px solid ${c.bd}`,
        bgcolor: c.bg,
        color: c.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {startIcon ? (
        <Box sx={{ display: 'flex', alignItems: 'center', '& .MuiSvgIcon-root': { fontSize: 14 } }}>
          {startIcon}
        </Box>
      ) : null}
      <Typography
        component="span"
        sx={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

