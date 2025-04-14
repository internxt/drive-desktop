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
    exclude: ['**/*.helper.test.ts', '**/node_modules', 'release'],
    globals: true,
    root: './',
    watch: true,
  },
});
