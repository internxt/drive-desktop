import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      reporter: 'lcov',
      provider: 'v8',
    },
    reporters: ['verbose'],
    setupFiles: './tests/vitest/setup.helper.test.ts',
    exclude: ['**/*.helper.test.ts', '**/node_modules', 'release'],
    globals: true,
    root: './',
    watch: true,
  },
});
