import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const releaseOnlyTestFiles = [
  'src/engine/validation/**',
  'src/release/pr8AcceptanceReport.test.ts'
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir: 'node_modules/.vite',
  test: {
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    testTimeout: 120000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', ...releaseOnlyTestFiles],
    pool: 'forks',
    singleFork: true,
    environment: 'jsdom'
  }
});
