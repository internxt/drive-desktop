import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      reporter: ['lcov', 'json-summary'],
      provider: 'v8',
      reportOnFailure: true,
    },
    reporters: ['verbose'],
    setupFiles: ['./tests/vitest/setup.helper.test.ts', './tests/vitest/setup.dom.test.ts'],
    include: ['src/apps/renderer/**/*.test.{ts,tsx}'],
    exclude: ['**/*.helper.test.ts', '**/*.infra.test.ts', '**/node_modules'],
    globals: true,
    root: './',
    testTimeout: 5000,
    environment: 'jsdom',
  },
});