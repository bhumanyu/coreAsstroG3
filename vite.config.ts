/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  test: {
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    testTimeout: 20000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    projects: [
      {
        name: 'node',
        test: {
          environment: 'node',
          include: ['src/**/*.{test,spec}.ts'],
          exclude: ['src/**/*.{test,spec}.tsx'],
          globals: true,
          setupFiles: './src/test/setupTests.ts',
          testTimeout: 30000,
        },
      },
      {
        name: 'jsdom',
        test: {
          environment: 'jsdom',
          include: ['src/**/*.{test,spec}.tsx'],
          globals: true,
          setupFiles: './src/test/setupTests.ts',
          testTimeout: 30000,
        },
      },
    ],
  },
});

