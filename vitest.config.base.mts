import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { ViteUserConfig } from 'vitest/config';

export function getConfigBase(): ViteUserConfig {
  return {
    plugins: [tsconfigPaths()],
    resolve: { alias: { 'original-fs': fileURLToPath(new URL('./tests/vitest/original-fs.helper.ts', import.meta.url)) } },
    test: {
      coverage: {
        provider: 'istanbul',
        reporter: ['lcov'],
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
