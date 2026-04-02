import React from 'react';
import { Box, Typography } from '@mui/material';

export default function StepsStrip({ steps = [], activeIndex = 0 }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', overflowX: 'auto', py: 0.5 }}>
      {steps.map((s, idx) => {
        const done = idx < activeIndex;
        const active = idx === activeIndex;
        const dotBg = done ? '#16a34a' : active ? '#667eea' : '#f1f5f9';
        const dotBd = done ? '#16a34a' : active ? '#667eea' : '#cbd5e1';
        const dotFg = done || active ? '#fff' : '#64748b';
        const text = done || active ? '#0f172a' : '#64748b';
        return (
          <Box key={s.id ?? idx} sx={{ display: 'flex', alignItems: 'center', minWidth: 86 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, px: 1 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  bgcolor: dotBg,
                  border: `2px solid ${dotBd}`,
                  color: dotFg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                {s.short ?? idx + 1}
              </Box>
              <Typography sx={{ fontSize: '0.68rem', textAlign: 'center', lineHeight: 1.2, color: text }}>
                {s.label}
              </Typography>
            </Box>
            {idx < steps.length - 1 ? (
              <Box sx={{ height: 2, width: 24, bgcolor: done ? '#16a34a' : '#e2e8f0', mt: -2.5 }} />
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

