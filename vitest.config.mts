import { defineConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const config = getConfigBase();

config!.test!.coverage!.reportsDirectory = './coverage/unit.info';
config!.test!.exclude = ['**/node_modules', '**/*.helper.test.ts', '**/*.infra.test.ts', '**/*.test.tsx'];

export default defineConfig(config);
