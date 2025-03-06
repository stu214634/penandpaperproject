import { createTheme, Theme } from '@mui/material/styles';

// Define scrollbar styles directly
const scrollbarStyles = {
  body: {
    '&::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '10px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '10px',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
      },
    },
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.1)',
    '& *': {
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.1)',
    }
  }
};

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
    MuiCssBaseline: {
      styleOverrides: scrollbarStyles,
    },
  },
}); 