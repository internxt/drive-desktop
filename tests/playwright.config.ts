import { type PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testMatch: /.*\.e2e\.ts/,
  timeout: 60_000,
  workers: 1, // disables test parallelism
};

// ts-prune-ignore-next
export default config;
