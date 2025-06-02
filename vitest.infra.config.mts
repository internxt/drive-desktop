import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      reporter: ['text', 'lcov', 'json', 'json-summary'],
      provider: 'v8',
      reportOnFailure: true,
    },
    reporters: ['verbose'],
    setupFiles: './tests/vitest/setup.helper.test.ts',
    include: ['**/*.infra.test.ts'],
    globals: true,
    root: './',
    watch: true,
    testTimeout: 15000,
  },
});
