import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'gh' ? '/github-pages/' : '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        kcTrackers: resolve(__dirname, 'kc-trackers/index.html'),
        kcTrackersPlayer: resolve(__dirname, 'kc-trackers/player.html'),
        bingo: resolve(__dirname, 'bingo/index.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    setupFiles: './src/setupTests.js',
  },
}));
