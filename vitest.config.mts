import { defineConfig } from 'vitest/config';
import { getConfigBase } from './vitest.config.base.mts';

const config = getConfigBase();

config!.test!.coverage!.reportsDirectory = './coverage/unit';
config!.test!.exclude = ['**/*.helper.test.ts', '**/*.infra.test.ts'];
config!.test!.include = ['src/**/check-dangled-files.test.ts'];

export default defineConfig(config);
