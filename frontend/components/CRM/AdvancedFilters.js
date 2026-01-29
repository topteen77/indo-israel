import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Collapse,
  DatePicker,
} from '@mui/material';
import {
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

const AdvancedFilters = ({ onFilterChange, initialFilters = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    status: initialFilters.status || '',
    jobCategory: initialFilters.jobCategory || '',
    minScore: initialFilters.minScore || '',
    maxScore: initialFilters.maxScore || '',
    dateFrom: initialFilters.dateFrom || null,
    dateTo: initialFilters.dateTo || null,
    experienceYears: initialFilters.experienceYears || '',
    hasPassport: initialFilters.hasPassport || '',
    workedAbroad: initialFilters.workedAbroad || '',
    recommendation: initialFilters.recommendation || '',
    ...initialFilters,
  });

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== '' && value !== null
  ).length;

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: '',
      jobCategory: '',
      minScore: '',
      maxScore: '',
      dateFrom: null,
      dateTo: null,
      experienceYears: '',
      hasPassport: '',
      workedAbroad: '',
      recommendation: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: expanded ? 2 : 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList color="primary" />
            <Typography variant="h6">Advanced Filters</Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                color="primary"
              />
            )}
          </Box>
          <Box>
            {activeFiltersCount > 0 && (
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={handleClearFilters}
                sx={{ mr: 1 }}
              >
                Clear All
              </Button>
            )}
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              {/* Status Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="under_review">Under Review</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="interviewed">Interviewed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Job Category Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Job Category</InputLabel>
                  <Select
                    value={filters.jobCategory}
                    label="Job Category"
                    onChange={(e) => handleFilterChange('jobCategory', e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="Construction">Construction</MenuItem>
                    <MenuItem value="Agriculture">Agriculture</MenuItem>
                    <MenuItem value="Healthcare">Healthcare</MenuItem>
                    <MenuItem value="IT">IT</MenuItem>
                    <MenuItem value="Hospitality">Hospitality</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Score Range */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Min Score"
                  type="number"
                  value={filters.minScore}
                  onChange={(e) => handleFilterChange('minScore', e.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Max Score"
                  type="number"
                  value={filters.maxScore}
                  onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>

              {/* Date Range */}
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              {/* Experience Years */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Experience</InputLabel>
                  <Select
                    value={filters.experienceYears}
                    label="Experience"
                    onChange={(e) => handleFilterChange('experienceYears', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="0-1">0-1 years</MenuItem>
                    <MenuItem value="2-4">2-4 years</MenuItem>
                    <MenuItem value="5-9">5-9 years</MenuItem>
                    <MenuItem value="10+">10+ years</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Passport Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Has Passport</InputLabel>
                  <Select
                    value={filters.hasPassport}
                    label="Has Passport"
                    onChange={(e) => handleFilterChange('hasPassport', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Worked Abroad Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Worked Abroad</InputLabel>
                  <Select
                    value={filters.workedAbroad}
                    label="Worked Abroad"
                    onChange={(e) => handleFilterChange('workedAbroad', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Interview Recommendation */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Recommendation</InputLabel>
                  <Select
                    value={filters.recommendation}
                    label="Recommendation"
                    onChange={(e) => handleFilterChange('recommendation', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="strongly_recommend">Strongly Recommend</MenuItem>
                    <MenuItem value="recommend">Recommend</MenuItem>
                    <MenuItem value="consider">Consider</MenuItem>
                    <MenuItem value="not_recommend">Not Recommend</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters;
