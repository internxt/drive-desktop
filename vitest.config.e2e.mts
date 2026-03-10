import { defineConfig, mergeConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const baseConfig = getConfigBase();

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        reportsDirectory: './coverage/e2e',
      },
      environment: 'jsdom',
      include: ['tests/e2e/**/*.e2e-spec.ts'],
      setupFiles: [
        './tests/vitest/setup.helper.test.ts',
        './tests/vitest/setup.dom.helper.test.ts',
      ],
      testTimeout: 50000,
    },
  })
);
