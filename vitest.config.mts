import { defineConfig, mergeConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const baseConfig = getConfigBase();

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        reportsDirectory: './coverage/unit',
      },
      exclude: ['**/*.helper.test.ts', '**/*.infra.test.ts'],
      include: ['src/**/*.test.ts'],
    },
  })
);
