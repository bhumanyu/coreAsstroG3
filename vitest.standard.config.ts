import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const releaseOnlyTestFiles = [
  'src/engine/validation/**',
  'src/release/pr8AcceptanceReport.test.ts'
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    testTimeout: 20000,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', ...releaseOnlyTestFiles],
    projects: [
      {
        name: 'node',
        test: {
          environment: 'node',
          include: ['src/**/*.{test,spec}.ts'],
          exclude: [
            'src/**/*.{test,spec}.tsx',
            'src/ai/security/browserBoundary.test.ts',
            ...releaseOnlyTestFiles
          ],
          globals: true,
          setupFiles: './src/test/setupTests.ts',
          testTimeout: 30000
        }
      },
      {
        name: 'jsdom',
        test: {
          environment: 'jsdom',
          include: ['src/**/*.{test,spec}.tsx'],
          globals: true,
          setupFiles: './src/test/setupTests.ts',
          testTimeout: 30000
        }
      }
    ]
  }
});
