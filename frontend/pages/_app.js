import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '../styles/globals.css';

// Apna.co-inspired modern theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#7B0FF5', // Purple - Apna.co primary color
      light: '#9D4EDD',
      dark: '#5A0A9E',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00C853', // Green - for success/positive actions
      light: '#4CAF50',
      dark: '#00897B',
      contrastText: '#ffffff',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontWeight: 800,
      fontSize: '3.5rem',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      '@media (max-width:600px)': {
        fontSize: '2.25rem',
      },
    },
    h2: {
      fontWeight: 800,
      fontSize: '2.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h3: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#1A1A1A',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#666666',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.04)',
    '0px 4px 8px rgba(0,0,0,0.06)',
    '0px 8px 16px rgba(0,0,0,0.08)',
    '0px 12px 24px rgba(0,0,0,0.10)',
    '0px 16px 32px rgba(0,0,0,0.12)',
    '0px 20px 40px rgba(0,0,0,0.14)',
    '0px 24px 48px rgba(0,0,0,0.16)',
    '0px 28px 56px rgba(0,0,0,0.18)',
    '0px 32px 64px rgba(0,0,0,0.20)',
    '0px 36px 72px rgba(0,0,0,0.22)',
    '0px 40px 80px rgba(0,0,0,0.24)',
    '0px 44px 88px rgba(0,0,0,0.26)',
    '0px 48px 96px rgba(0,0,0,0.28)',
    '0px 52px 104px rgba(0,0,0,0.30)',
    '0px 56px 112px rgba(0,0,0,0.32)',
    '0px 60px 120px rgba(0,0,0,0.34)',
    '0px 64px 128px rgba(0,0,0,0.36)',
    '0px 68px 136px rgba(0,0,0,0.38)',
    '0px 72px 144px rgba(0,0,0,0.40)',
    '0px 76px 152px rgba(0,0,0,0.42)',
    '0px 80px 160px rgba(0,0,0,0.44)',
    '0px 84px 168px rgba(0,0,0,0.46)',
    '0px 88px 176px rgba(0,0,0,0.48)',
    '0px 92px 184px rgba(0,0,0,0.50)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(123, 15, 245, 0.25)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 6px 16px rgba(123, 15, 245, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#7B0FF5',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#7B0FF5',
              borderWidth: 2,
            },
          },
        },
      },
    },
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
