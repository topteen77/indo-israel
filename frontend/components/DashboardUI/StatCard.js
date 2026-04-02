import React from 'react';
import { Box, Typography } from '@mui/material';

export default function StatCard({ label, value, delta, tone = 'blue', icon }) {
  const toneMap = {
    blue: { fg: '#667eea', bg: 'rgba(102,126,234,0.10)' },
    green: { fg: '#16a34a', bg: 'rgba(22,163,74,0.10)' },
    gold: { fg: '#d97706', bg: 'rgba(217,119,6,0.10)' },
    coral: { fg: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
    violet: { fg: '#7B0FF5', bg: 'rgba(123,15,245,0.10)' },
    gray: { fg: '#64748b', bg: 'rgba(148,163,184,0.14)' },
  };
  const t = toneMap[tone] || toneMap.blue;

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid #e8eaf0',
        borderRadius: 3,
        px: 2.25,
        py: 2,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography
            sx={{
              fontSize: '0.68rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 800,
              mb: 0.75,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
          >
            {label}
          </Typography>
          <Typography sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, color: '#0f172a' }}>
            {value}
          </Typography>
          {delta ? (
            <Typography sx={{ mt: 0.75, fontSize: '0.8rem', color: '#64748b' }}>{delta}</Typography>
          ) : null}
        </Box>

        {icon ? (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 999,
              bgcolor: t.bg,
              color: t.fg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& .MuiSvgIcon-root': { fontSize: 22 },
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

