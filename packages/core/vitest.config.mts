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
    exclude: ['**/*.helper.test.ts', '**/*.infra.test.ts', '**/node_modules'],
    globals: true,
    reporters: ['verbose'],
    root: './',
    setupFiles: './tests/vitest/setup.helper.test.ts',
    testTimeout: 5000,
    watch: true,
  },
});
