import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { theme } from './theme';
import { Navigation } from './components/Navigation';
import { AudioTrackPanel } from './components/AudioTrackPanel';
import { lazy, Suspense } from 'react';

// Regular import for the Dashboard as it's likely the first page users see
import { Dashboard } from './pages/Dashboard';

// Lazy load other pages to reduce initial bundle size
const MapViewLazy = lazy(() => import('./pages/MapView').then(module => ({ default: module.MapView })));
const LocationsViewLazy = lazy(() => import('./pages/LocationsView').then(module => ({ default: module.LocationsView })));
const CharactersViewLazy = lazy(() => import('./pages/CharactersView').then(module => ({ default: module.CharactersView })));
const CombatsViewLazy = lazy(() => import('./components/CombatsView').then(module => ({ default: module.CombatsView })));

// Define a lazy loading wrapper component for the combat session view
const CombatSessionView = () => {
  const LazyComponent = lazy(() => 
    import('./pages/CombatSessionView')
      .then(module => ({ default: module.CombatSessionView }))
      .catch(() => ({ 
        default: () => <Box>Combat session view not available</Box>
      }))
  );
  
  return (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent />
    </Suspense>
  );
};

// Loading component for Suspense fallback
const LoadingComponent = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
);

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
                <Route path="/combat-session" element={<CombatSessionView />} />
              </Routes>
            </Suspense>
          </Box>
          
          {/* AudioTrackPanel rendered at App level so it's globally available */}
          <AudioTrackPanel />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 