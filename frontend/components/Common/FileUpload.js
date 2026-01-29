import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Delete,
  CheckCircle,
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import api from '../../utils/api';

const FileUpload = ({
  label = 'Upload Files',
  accept = '.pdf,.jpg,.jpeg,.png',
  multiple = true,
  maxSize = 5 * 1024 * 1024, // 5MB
  value = [],
  onChange,
  onError,
  uploadEndpoint = '/applications/upload',
}) => {
  const [files, setFiles] = useState(value || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`${file.name} exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
    }
    
    // Check file type
    const extension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = accept.split(',').map(ext => ext.trim().replace('.', ''));
    if (!allowedExtensions.includes(extension)) {
      errors.push(`${file.name} is not an allowed file type`);
    }
    
    return errors;
  };

  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const newErrors = [];
    const validFiles = [];

    // Validate each file
    selectedFiles.forEach((file) => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        newErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      if (onError) onError(newErrors);
      return;
    }

    setErrors([]);
    setUploading(true);

    try {
      // Upload files
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percentCompleted,
            }));
          },
        };

        const response = await api.post(uploadEndpoint, formData, config);
        return {
          name: file.name,
          url: response.data.url || response.data.fileUrl,
          size: file.size,
          type: file.type,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const updatedFiles = [...files, ...uploadedFiles];
      
      setFiles(updatedFiles);
      if (onChange) onChange(updatedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMsg = error.response?.data?.message || 'Upload failed';
      setErrors([errorMsg]);
      if (onError) onError([errorMsg]);
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    if (onChange) onChange(updatedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const event = {
        target: { files: e.dataTransfer.files },
      };
      handleFileSelect(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      
      <Paper
        variant="outlined"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          p: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: 'divider',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Drag and drop files here, or click to select
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Accepted: {accept} (Max: {maxSize / 1024 / 1024}MB)
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Paper>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.map((error, idx) => (
            <div key={idx}>{error}</div>
          ))}
        </Alert>
      )}

      {files.length > 0 && (
        <List sx={{ mt: 2 }}>
          {files.map((file, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() => handleRemove(index)}
                  disabled={uploading}
                >
                  <Delete />
                </IconButton>
              }
            >
              <ListItemIcon>
                {uploadProgress[file.name] !== undefined ? (
                  <CircularProgress
                    size={24}
                    variant="determinate"
                    value={uploadProgress[file.name]}
                  />
                ) : (
                  <CheckCircle color="success" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={file.name || file}
                secondary={
                  file.size
                    ? `${(file.size / 1024).toFixed(2)} KB`
                    : 'Uploaded'
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Uploading files...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
