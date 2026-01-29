import React from 'react';
import { Box, CircularProgress, Backdrop } from '@mui/material';

const LoadingOverlay = ({ open = false, message = 'Loading...' }) => {
  return (
    <Backdrop
      open={open}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <CircularProgress color="inherit" />
      {message && (
        <Box sx={{ color: 'white', fontSize: '1rem' }}>
          {message}
        </Box>
      )}
    </Backdrop>
  );
};

export default LoadingOverlay;
