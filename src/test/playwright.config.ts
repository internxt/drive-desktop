import { type PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testMatch: /.*\.e2e\.ts/,
  timeout: 60000,
  workers: 1, // disables test parallelism
};

export default config;
