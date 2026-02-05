import React, { useState, useEffect } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import {
  Language,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const LanguageSelector = ({ variant = 'outlined', size = 'medium' }) => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧', nativeLabel: 'English' },
    { code: 'he', label: 'עברית', flag: '🇮🇱', nativeLabel: 'עברית' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', nativeLabel: 'हिन्दी' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳', nativeLabel: 'ਪੰਜਾਬੀ' },
  ];

  useEffect(() => {
    setMounted(true);
    // Get the current language from i18n (which should match localStorage)
    const lang = i18n.language || 'en';
    setCurrentLanguage(lang);
  }, [i18n.language]);

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    
    // Save language preference to localStorage first
    localStorage.setItem('preferredLanguage', newLang);
    
    // Change language
    i18n.changeLanguage(newLang).then(() => {
      // Update document direction for RTL languages (Hebrew)
      if (newLang === 'he') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
      
      // Reload page to apply language change to all components
      // This ensures components that don't use useTranslation hook also update
      window.location.reload();
    });
  };

  // Prevent hydration mismatch by using consistent default on server and client
  if (!mounted) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Language sx={{ color: 'white' }} />
        <FormControl variant={variant} size={size} sx={{ minWidth: 120 }}>
          <Select 
            value="en" 
            displayEmpty 
            disabled
            sx={{
              color: 'white',
              '& .MuiSelect-icon': {
                color: 'white',
              },
              '& .MuiTypography-root': {
                color: 'white !important',
              },
              '&::before': {
                borderColor: 'rgba(255, 255, 255, 0.42)',
              },
              '&::after': {
                borderColor: 'white',
              },
              '&:hover:not(.Mui-disabled)::before': {
                borderColor: 'rgba(255, 255, 255, 0.87)',
              },
            }}
          >
            <MenuItem value="en">
              <Typography sx={{ color: 'black' }}>English</Typography>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Language sx={{ color: 'white' }} />
      <FormControl variant={variant} size={size} sx={{ minWidth: 120 }}>
        <Select
          value={currentLanguage}
          onChange={handleLanguageChange}
          displayEmpty
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: 'white',
                '& .MuiMenuItem-root': {
                  color: 'black',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                },
              },
            },
          }}
          sx={{
            color: 'white',
            '& .MuiSelect-icon': {
              color: 'white',
            },
            '& .MuiTypography-root': {
              color: 'white !important',
            },
            '&::before': {
              borderColor: 'rgba(255, 255, 255, 0.42)',
            },
            '&::after': {
              borderColor: 'white',
            },
            '&:hover:not(.Mui-disabled)::before': {
              borderColor: 'rgba(255, 255, 255, 0.87)',
            },
          }}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              <Typography sx={{ color: 'black' }}>{lang.label}</Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector;
