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
}); 