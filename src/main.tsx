import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'mapbox-gl/dist/mapbox-gl.css';
import { preloadRouteComponents } from './importManifest.ts';

// Pre-cache important route components after initial render
// to ensure they're available when needed
setTimeout(() => {
  preloadRouteComponents();
}, 2000);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
); 