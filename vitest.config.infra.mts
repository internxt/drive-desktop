import { defineConfig, mergeConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const baseConfig = getConfigBase();

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        reportsDirectory: './coverage/infra',
      },
      include: ['src/**/*.infra.test.ts'],
      testTimeout: 20000,
      fileParallelism: false,
    },
  })
);