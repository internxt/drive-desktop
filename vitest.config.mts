import { defineConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const config = getConfigBase();

config!.test!.coverage!.reportsDirectory = './coverage/unit.info';
config!.test!.exclude = ['**/*.helper.test.ts', '**/*.infra.test.ts', '**/*.test.tsx'];
config!.test!.include = ['src/**/*.test.ts'];

export default defineConfig(config);
