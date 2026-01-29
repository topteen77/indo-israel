import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  MoreVert,
  Delete,
  Archive,
  Send,
  Download,
} from '@mui/icons-material';

const BulkActionsToolbar = ({
  selectedCount,
  selectedItems,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
  onBulkArchive,
  onBulkExport,
  onClearSelection,
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleBulkApprove = async () => {
    setActionLoading(true);
    try {
      await onBulkApprove(selectedItems);
      onClearSelection();
    } catch (error) {
      console.error('Bulk approve error:', error);
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  const handleBulkRejectClick = () => {
    setRejectDialogOpen(true);
    handleMenuClose();
  };

  const handleBulkRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    setActionLoading(true);
    try {
      await onBulkReject(selectedItems, rejectReason);
      setRejectDialogOpen(false);
      setRejectReason('');
      onClearSelection();
    } catch (error) {
      console.error('Bulk reject error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedCount} item(s)?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await onBulkDelete(selectedItems);
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete error:', error);
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  const handleBulkArchive = async () => {
    setActionLoading(true);
    try {
      await onBulkArchive(selectedItems);
      onClearSelection();
    } catch (error) {
      console.error('Bulk archive error:', error);
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  const handleBulkExport = async () => {
    setActionLoading(true);
    try {
      await onBulkExport(selectedItems);
    } catch (error) {
      console.error('Bulk export error:', error);
    } finally {
      setActionLoading(false);
      handleMenuClose();
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          minHeight: '56px !important',
        }}
      >
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
          <Chip
            label={`${selectedCount} selected`}
            size="small"
            sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 600 }}
          />
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<CheckCircle />}
            onClick={handleBulkApprove}
            disabled={actionLoading}
            sx={{ color: 'white' }}
          >
            Approve
          </Button>
          <Button
            color="inherit"
            startIcon={<Cancel />}
            onClick={handleBulkRejectClick}
            disabled={actionLoading}
            sx={{ color: 'white' }}
          >
            Reject
          </Button>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            disabled={actionLoading}
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Toolbar>

      {/* More Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleBulkArchive}>
          <Archive sx={{ mr: 1 }} />
          Archive
        </MenuItem>
        <MenuItem onClick={handleBulkExport}>
          <Download sx={{ mr: 1 }} />
          Export Selected
        </MenuItem>
        <MenuItem onClick={handleBulkDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !actionLoading && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bulk Reject Applications</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are about to reject {selectedCount} application(s). This action cannot be undone.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectReason('');
            }}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkRejectConfirm}
            variant="contained"
            color="error"
            disabled={!rejectReason.trim() || actionLoading}
          >
            {actionLoading ? 'Rejecting...' : 'Reject All'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionsToolbar;
