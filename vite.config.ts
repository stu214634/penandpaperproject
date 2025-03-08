import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/penandpaperproject/', // GitHub Pages repository name
  server: {
    port: 3000,
  },
  envPrefix: 'REACT_APP_',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled'
          ],
          'map-vendor': ['mapbox-gl', 'react-map-gl'],
          'utilities': ['zustand', 'uuid', 'howler']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase the warning limit (in KB)
  }
}); 