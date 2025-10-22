import { defineConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const config = getConfigBase();

config!.test!.coverage!.reportsDirectory = './coverage/renderer.info';
config!.test!.environment = 'jsdom';
config!.test!.include = ['**/renderer/**/*.test.tsx'];
config!.test!.setupFiles = ['./tests/vitest/setup.helper.test.ts', './tests/vitest/setup.dom.helper.test.ts'];

export default defineConfig(config);
