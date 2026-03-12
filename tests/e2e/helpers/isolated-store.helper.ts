import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export function getIsolatedStore(): { homeDir: string; appDir: string } {
  const dir = TEST_FILES;
  const homeDir = join(dir, 'e2e-home');
  const appDir = join(dir, 'e2e-app');
  return { homeDir, appDir };
}

export function createIsolatedStore() {
  const { homeDir, appDir } = getIsolatedStore();
  mkdirSync(homeDir, { recursive: true });
  mkdirSync(appDir, { recursive: true });
}

export function cleanupIsolatedStore() {
  const { homeDir, appDir } = getIsolatedStore();
  rmSync(homeDir, { recursive: true, force: true });
  rmSync(appDir, { recursive: true, force: true });
}
