import tsconfigPaths from 'vite-tsconfig-paths';
import { ViteUserConfig } from 'vitest/config';

export function getConfigBase(): ViteUserConfig {
  return {
    plugins: [tsconfigPaths()],
    test: {
      coverage: {
        provider: 'istanbul',
        reporter: ['lcov', 'json-summary'],
        reportOnFailure: true,
      },
      clearMocks: true,
      globals: true,
      reporters: ['verbose'],
      root: './',
      setupFiles: './tests/vitest/setup.helper.test.ts',
      testTimeout: 5000,
      watch: false,
    },
  };
}
