import React from 'react';
import { Box, Typography } from '@mui/material';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toneForRisk(risk) {
  if (risk >= 70) return { tone: 'coral', color: '#ef4444', label: 'High' };
  if (risk >= 35) return { tone: 'gold', color: '#d97706', label: 'Moderate' };
  return { tone: 'green', color: '#16a34a', label: 'Low' };
}

export default function FraudMeter({ risk = 0, label }) {
  const val = clamp(Number.isFinite(risk) ? risk : 0, 0, 100);
  const t = toneForRisk(val);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 7, bgcolor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
        <Box sx={{ width: `${val}%`, height: '100%', bgcolor: t.color, borderRadius: 999 }} />
      </Box>
      <Typography
        sx={{
          width: 68,
          textAlign: 'right',
          fontSize: '0.72rem',
          color: t.color,
          fontWeight: 700,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}
      >
        {label ?? t.label}
      </Typography>
    </Box>
  );
}

