/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir: 'node_modules/.vite',
  build: {
    // ES2022 is intentional: module top-level await is required for fail-closed
    // ephemeris startup and is the minimum supported browser/WebView target.
    target: 'es2022',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  test: {
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    testTimeout: 120000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    pool: 'forks',
    singleFork: true,
    environment: 'jsdom'
  },
});
