import React from 'react';
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

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'he', label: 'עברית', flag: '🇮🇱' },
  ];

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
    
    // Update document direction for Hebrew (RTL)
    if (newLang === 'he') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Language color="action" />
      <FormControl variant={variant} size={size} sx={{ minWidth: 120 }}>
        <Select
          value={i18n.language || 'en'}
          onChange={handleLanguageChange}
          displayEmpty
        >
          {languages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{lang.flag}</span>
                <Typography>{lang.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector;
