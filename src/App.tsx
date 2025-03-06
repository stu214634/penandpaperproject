import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { LocationsView } from './pages/LocationsView';
import { MapView } from './pages/MapView';
// Import will be available after recompilation
// import { CharactersView } from './pages/CharactersView';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Navigation />
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/locations" element={<LocationsView />} />
              {/* Temporarily comment out until available */}
              {/* <Route path="/characters" element={<CharactersView />} /> */}
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 