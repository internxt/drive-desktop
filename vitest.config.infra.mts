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
    include: ['**/sync-remote-changes-to-local.infra.test.ts'],
    exclude: ['**/*.helper.test.ts', '**/node_modules', 'src/apps/renderer/**/*.test.{ts,tsx}'],
    globals: true,
    reporters: ['verbose'],
    root: './',
    setupFiles: './tests/vitest/setup.helper.test.ts',
    testTimeout: 20000,
  },
});
