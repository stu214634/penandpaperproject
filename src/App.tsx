import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography, Button } from '@mui/material';
import { theme } from './theme';
import { Navigation } from './components/Navigation';
import { AudioTrackPanel } from './components/AudioTrackPanel';
import { lazy, Suspense, useState, ComponentType } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Regular import for the Dashboard as it's likely the first page users see
import { Dashboard } from './pages/Dashboard';

// Helper function to create resilient lazy components
const createLazyComponent = (
  importFn: () => Promise<any>, 
  componentName: string
): ComponentType => {
  return lazy(() => 
    importFn()
      .then((module: any) => {
        if (module[componentName]) {
          return { default: module[componentName] };
        }
        console.error(`Component ${componentName} not found in the module`);
        return { 
          default: () => (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                Failed to load component
              </Typography>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </Box>
          )
        };
      })
      .catch((error: Error) => {
        console.error(`Error loading component ${componentName}:`, error);
        return { 
          default: () => (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                Failed to load component
              </Typography>
              <Typography variant="body1" paragraph>
                Error: {error.message}
              </Typography>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </Box>
          )
        };
      })
  );
};

// Lazy load other pages to reduce initial bundle size
const MapViewLazy = createLazyComponent(() => import('./pages/MapView'), 'MapView');
const LocationsViewLazy = createLazyComponent(() => import('./pages/LocationsView'), 'LocationsView');
const CharactersViewLazy = createLazyComponent(() => import('./pages/CharactersView'), 'CharactersView');
const CombatsViewLazy = createLazyComponent(() => import('./components/CombatsView'), 'CombatsView');
const CombatSessionViewLazy = createLazyComponent(() => import('./pages/CombatSessionView'), 'CombatSessionView');

// Loading component for Suspense fallback
const LoadingComponent = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
);

// Error handling component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h5" color="error" gutterBottom>
      Something went wrong
    </Typography>
    <Typography variant="body1" paragraph>
      {error.message}
    </Typography>
    <Button variant="contained" onClick={resetErrorBoundary}>
      Try again
    </Button>
  </Box>
);

// Create a simple global variable to check if ReactMarkdown is loaded
window.ReactMarkdownLoaded = true;

// Small component to ensure ReactMarkdown is included in the bundle
// This is never rendered but tricks the bundler
const EnsureMarkdown = () => {
  // This is a "secret" component that never renders
  // It ensures React-Markdown is included in the bundle
  if (false) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>test</ReactMarkdown>;
  }
  return null;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename="/penandpaperproject">
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Navigation />
          <Box sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
            <Suspense fallback={<LoadingComponent />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/map" element={<MapViewLazy />} />
                <Route path="/locations" element={<LocationsViewLazy />} />
                <Route path="/characters" element={<CharactersViewLazy />} />
                <Route path="/combats" element={<CombatsViewLazy />} />
                <Route path="/combat-session" element={<CombatSessionViewLazy />} />
              </Routes>
            </Suspense>
          </Box>
          
          {/* AudioTrackPanel rendered at App level so it's globally available */}
          <AudioTrackPanel />
        </Box>
        {/* This component is never visible, but ensures ReactMarkdown is included */}
        <EnsureMarkdown />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 