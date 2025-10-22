import { defineConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const config = getConfigBase();

config!.test!.coverage!.reportsDirectory = './coverage/infra.info';
config!.test!.include = ['**/*.infra.test.ts'];
config!.test!.testTimeout = 20000;

export default defineConfig(config);
