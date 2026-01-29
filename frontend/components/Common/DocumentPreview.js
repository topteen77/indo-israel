import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Close,
  Download,
  PictureAsPdf,
  Image as ImageIcon,
} from '@mui/icons-material';

const DocumentPreview = ({ open, onClose, document, fileName }) => {
  const isImage = document?.startsWith('data:image') || 
                  document?.match(/\.(jpg|jpeg|png|gif)$/i);
  const isPdf = document?.match(/\.pdf$/i) || 
                document?.includes('application/pdf');

  const handleDownload = () => {
    if (!document || typeof window === 'undefined') return;

    const link = window.document.createElement('a');
    link.href = document;
    link.download = fileName || 'document';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Document Preview</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={document}
              alt={fileName || 'Preview'}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          ) : isPdf ? (
            <Box>
              <PictureAsPdf sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                PDF Document
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fileName || 'document.pdf'}
              </Typography>
              <iframe
                src={document}
                style={{ width: '100%', height: '500px', border: 'none', marginTop: 2 }}
                title="PDF Preview"
              />
            </Box>
          ) : (
            <Box>
              <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Preview not available
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {document && (
          <Button
            onClick={handleDownload}
            variant="contained"
            startIcon={<Download />}
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DocumentPreview;
