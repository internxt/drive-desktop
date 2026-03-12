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
      environment: 'node',
      include: ['tests/e2e/**/*.e2e-test.ts'],
      setupFiles: [
        'dotenv/config',
        './tests/vitest/setup.e2e.helper.test.ts',
      ],
      testTimeout: 60_000,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      maxConcurrency: 1
    },
  })
);
