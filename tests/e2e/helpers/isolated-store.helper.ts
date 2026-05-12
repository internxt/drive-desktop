import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';

export function getIsolatedStore(): { homeDir: string; appDir: string } {
  const dir = TEST_FILES;
  const homeDir = join(dir, 'e2e-home');
  const appDir = join(dir, 'e2e-app');
  mkdirSync(homeDir, { recursive: true });
  mkdirSync(appDir, { recursive: true });
  return { homeDir, appDir };
}

export function cleanupIsolatedStore() {
  const { homeDir, appDir } = getIsolatedStore();
  rmSync(homeDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  rmSync(appDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}
