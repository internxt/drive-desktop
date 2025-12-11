import { defineConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const config = getConfigBase();

config!.test!.coverage!.reportsDirectory = './coverage/infra';
config!.test!.include = ['src/**/*.infra.test.ts'];
config!.test!.testTimeout = 20000;
config!.test!.fileParallelism = false;

export default defineConfig(config);
