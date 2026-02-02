import React, { useEffect } from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { Translate } from '@mui/icons-material';

/**
 * Google Translate Widget Component
 * Adds Google Translate functionality to the page
 * 
 * Usage:
 * <GoogleTranslate />
 */
const GoogleTranslate = () => {
  useEffect(() => {
    // Add Google Translate script if not already added
    if (!window.google || !window.google.translate) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      // Initialize Google Translate
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,he,hi,pa',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      };
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const toggleTranslate = () => {
    const translateElement = document.getElementById('google_translate_element');
    if (translateElement) {
      const select = translateElement.querySelector('.goog-te-combo');
      if (select) {
        select.click();
      }
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title="Translate Page">
        <IconButton
          onClick={toggleTranslate}
          sx={{
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'white',
            },
          }}
        >
          <Translate />
        </IconButton>
      </Tooltip>
      <Box
        id="google_translate_element"
        sx={{
          position: 'absolute',
          top: '100%',
          right: 0,
          zIndex: 1300,
          mt: 1,
          display: 'none',
        }}
      />
    </Box>
  );
};

export default GoogleTranslate;
