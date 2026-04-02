import React from 'react';
import { Box } from '@mui/material';

const map = {
  green: '#16a34a',
  blue: '#667eea',
  gold: '#d97706',
  coral: '#ef4444',
  gray: '#94a3b8',
  violet: '#7B0FF5',
};

export default function StatusDot({ tone = 'gray' }) {
  const c = map[tone] || map.gray;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        bgcolor: c,
        boxShadow: `0 0 0 3px rgba(148,163,184,0.15)`,
        flexShrink: 0,
      }}
    />
  );
}

