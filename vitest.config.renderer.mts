import { defineConfig, mergeConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const baseConfig = getConfigBase();

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        reportsDirectory: './coverage/renderer',
      },
      environment: 'jsdom',
      include: ['src/**/*.test.tsx', 'src/apps/renderer/**/*.test.ts'],
      setupFiles: ['./tests/vitest/setup.helper.test.ts', './tests/vitest/setup.dom.helper.test.ts'],
    },
  }),
);
