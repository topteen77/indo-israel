import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import {
  Clear,
  CheckCircle,
} from '@mui/icons-material';

const SignaturePad = ({ value, onChange, label = 'Digital Signature', required = true }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if value provided
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        const signature = canvas.toDataURL('image/png');
        if (onChange) onChange(signature);
      }
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onChange) onChange('');
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          border: hasSignature ? '2px solid green' : '2px solid',
          borderColor: hasSignature ? 'success.main' : 'divider',
        }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          style={{
            width: '100%',
            height: '200px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearSignature}
            size="small"
          >
            Clear
          </Button>
          {hasSignature && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
              <CheckCircle fontSize="small" />
              <Typography variant="caption">Signature captured</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {required && !hasSignature && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Please provide your digital signature
        </Alert>
      )}
    </Box>
  );
};

export default SignaturePad;
