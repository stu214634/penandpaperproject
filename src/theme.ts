import { createTheme, Theme } from '@mui/material/styles';

export const theme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c4dff',
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d',
          borderRadius: 8,
        },
      },
    },
  },
}); 