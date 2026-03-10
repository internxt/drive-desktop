import { defineConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const config = getConfigBase();

config!.test!.coverage!.reportsDirectory = './coverage/e2e';
config!.test!.environment = 'jsdom';
config!.test!.include = ['tests/e2e/**/*.e2e-spec.ts'];
config!.test!.setupFiles = ['./tests/vitest/setup.helper.test.ts', './tests/vitest/setup.dom.helper.test.ts'];
config!.test!.testTimeout = 50000;

export default defineConfig(config);
