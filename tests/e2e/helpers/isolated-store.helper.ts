import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import * as fs from 'node:fs';
import * as path from 'node:path';

export function getIsolatedStore(): { homeDir: string; appDir: string } {
  const dir = TEST_FILES;
  const homeDir = path.join(dir, 'e2e-home');
  const appDir = path.join(dir, 'e2e-app');
  return { homeDir, appDir };
}

export function createIsolatedStore() {
  const { homeDir, appDir } = getIsolatedStore();
  fs.mkdirSync(homeDir, { recursive: true });
  fs.mkdirSync(appDir, { recursive: true });
}

export function cleanupIsolatedStore() {
  const { homeDir, appDir } = getIsolatedStore();
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(appDir, { recursive: true, force: true });
}
