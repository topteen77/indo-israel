import React from 'react';
import { Box, Typography } from '@mui/material';

const toneMap = {
  green: '#16a34a',
  blue: '#667eea',
  violet: '#7B0FF5',
  gold: '#d97706',
  coral: '#ef4444',
  gray: '#94a3b8',
};

export default function ScoreBar({ label, value, max = 100, tone = 'blue', rightLabel }) {
  const v = Number.isFinite(value) ? value : 0;
  const denom = max > 0 ? max : 100;
  const pct = Math.max(0, Math.min(100, (v / denom) * 100));
  const fill = toneMap[tone] || toneMap.blue;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, gap: 2 }}>
        <Typography sx={{ fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
          {rightLabel ?? v}
        </Typography>
      </Box>
      <Box sx={{ height: 6, bgcolor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: fill, borderRadius: 999, transition: 'width 200ms ease' }} />
      </Box>
    </Box>
  );
}

