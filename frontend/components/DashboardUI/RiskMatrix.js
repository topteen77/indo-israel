import React from 'react';
import { Box, Typography } from '@mui/material';

export default function RiskMatrix({ items = [] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 1.25,
      }}
    >
      {items.map((it, idx) => (
        <Box
          key={it.id ?? idx}
          sx={{
            bgcolor: '#fff',
            border: '1px solid #e8eaf0',
            borderRadius: 2.5,
            p: 1.5,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.03)',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.66rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 800,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              mb: 0.75,
            }}
          >
            {it.label}
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {it.value}
          </Typography>
          {it.sub ? (
            <Typography sx={{ mt: 0.5, fontSize: '0.78rem', color: '#64748b' }}>{it.sub}</Typography>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

