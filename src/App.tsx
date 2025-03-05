import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { LocationsView } from './pages/LocationsView';
import { MapView } from './pages/MapView';
import { CharactersView } from './pages/CharactersView';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/locations" element={<LocationsView />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/characters" element={<CharactersView />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 