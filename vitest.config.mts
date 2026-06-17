import { defineConfig, mergeConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const baseConfig = getConfigBase();

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        include: ['src/**/*.{js,ts,tsx}'],
        exclude: ['**/performance-test/**'],
        reportsDirectory: './coverage/unit',
      },
      exclude: ['**/*.helper.test.ts', '**/*.infra.test.ts', '**/performance-test/**'],
      include: ['src/**/*.test.ts'],
    },
  }),
);
