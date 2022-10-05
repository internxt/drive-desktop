// playwright.config.ts
import { type PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testMatch: /.*\.e2e\.ts/,
  timeout: 300000000,
};
export default config;
