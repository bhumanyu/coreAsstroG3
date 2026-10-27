import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    testTimeout: 30000,
    include: ['src/ai/security/browserBoundary.test.ts'],
  },
});
