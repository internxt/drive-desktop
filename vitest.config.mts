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
    setupFiles: './tests/vitest/setup.helper.test.ts',
    exclude: ['**/*.helper.test.ts', '**/*.infra.test.ts', '**/node_modules'],
    globals: true,
    root: './',
    watch: true,
    testTimeout: 5000,
  },
});
