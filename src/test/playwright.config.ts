import { type PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testMatch: /.*\.e2e\.ts/,
  timeout: 60000,
};

export default config;
