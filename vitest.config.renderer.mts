import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'json-summary'],
      reportOnFailure: true,
    },
    clearMocks: true,
    environment: 'jsdom',
    globals: true,
    include: ['src/apps/renderer/**/*.test.{ts,tsx}'],
    reporters: ['verbose'],
    root: './',
    setupFiles: ['./tests/vitest/setup.helper.test.ts', './tests/vitest/setup.dom.helper.test.ts'],
    testTimeout: 5000,
  },
});
