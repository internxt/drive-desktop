import { defineConfig, mergeConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const baseConfig = getConfigBase();

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['src/context/virtual-drive/items/application/performance-test/**/*.perf.ts'],
      testTimeout: 30 * 60 * 1000,
    },
  }),
);
