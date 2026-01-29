import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Download,
  FileDownload,
  TableChart,
} from '@mui/icons-material';
// Note: For Excel export, install xlsx: npm install xlsx
// For now, Excel export will show a message to install the library

const ExportButton = ({ data, filename = 'export', loading = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);
    try {
      // Convert data to CSV format
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((header) => {
            const value = row[header];
            // Handle null/undefined and escape commas/quotes
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        ),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Failed to export CSV');
    } finally {
      setExporting(false);
      handleClose();
    }
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Check if xlsx is available
    try {
      // Try to dynamically import xlsx
      import('xlsx').then((XLSX) => {
        setExporting(true);
        try {
          // Convert data to worksheet
          const worksheet = XLSX.utils.json_to_sheet(data);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

          // Generate Excel file and download
          XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
          console.error('Excel export error:', error);
          alert('Failed to export Excel file');
        } finally {
          setExporting(false);
          handleClose();
        }
      }).catch(() => {
        alert('Excel export requires xlsx library. Please install it: npm install xlsx\n\nFor now, please use CSV export.');
        handleClose();
      });
    } catch (error) {
      alert('Excel export requires xlsx library. Please install it: npm install xlsx\n\nFor now, please use CSV export.');
      handleClose();
    }
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('JSON export error:', error);
      alert('Failed to export JSON');
    } finally {
      setExporting(false);
      handleClose();
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={exporting || loading ? <CircularProgress size={16} /> : <Download />}
        onClick={handleClick}
        disabled={exporting || loading || !data || data.length === 0}
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={exportToCSV}>
          <FileDownload sx={{ mr: 1 }} />
          Export as CSV
        </MenuItem>
        <MenuItem onClick={exportToExcel}>
          <TableChart sx={{ mr: 1 }} />
          Export as Excel
        </MenuItem>
        <MenuItem onClick={exportToJSON}>
          <FileDownload sx={{ mr: 1 }} />
          Export as JSON
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;
