import { _electron, expect as pwExpect } from '@playwright/test';
import type { ElectronApplication } from '@playwright/test';
import { fail } from 'node:assert';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { afterEach, describe, it } from 'vitest';
import { sleep } from '@/apps/main/util';
import { DEFAULT_TIMEOUT } from './helpers/e2e-configuration.helper';
import { getFirstWindow, launchElectronApp } from './helpers/electron.helper';
import { cleanupIsolatedStore, getIsolatedStore } from './helpers/isolated-store.helper';
import { assertLoggedIn, triggerAndCompleteSSOLogin } from './helpers/login.helper';

const TEST_FILE_NAME = `test-upload-${Date.now()}.txt`;
const TEST_FILE_CONTENT = 'Test content for upload';

describe('Upload-Download scenario test', () => {
  beforeAll(() => {
    cleanupIsolatedStore();
  });

  const email = process.env.E2E_TEST_USER;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email) fail('E2E_TEST_USER env var is not set');
  if (!password) fail('E2E_TEST_PASSWORD env var is not set');

  let electronApp: ElectronApplication;

  afterEach(async () => {
    await electronApp?.close();
  });

  async function getSyncFolderPath(electronApp: ElectronApplication): Promise<string> {
    const window = await electronApp.firstWindow();
    await window.waitForFunction(() => (globalThis as any).window?.electron?.driveGetSyncRoot, { timeout: 30000 });
    return window.evaluate(() => (globalThis as any).window.electron.driveGetSyncRoot());
  }

  async function waitForSyncStatus(
    electronApp: ElectronApplication,
    expectedStatus: string,
    timeout: number = DEFAULT_TIMEOUT,
  ): Promise<void> {
    const window = await electronApp.firstWindow();
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await window.evaluate(() => {
        return (globalThis as any).window.electron.getRemoteSyncStatus();
      });

      if (status === expectedStatus) {
        return;
      }

      await sleep(2000);
    }

    throw new Error(`Timeout waiting for sync status: ${expectedStatus}`);
  }

  it('should upload a file to the cloud', async () => {
    electronApp = await launchElectronApp();

    const window = await getFirstWindow(electronApp);

    await triggerAndCompleteSSOLogin(electronApp, window, {
      email,
      password,
    });

    await assertLoggedIn(electronApp, email);

    const syncFolderPath = await getSyncFolderPath(electronApp);
    const testFilePath = `${syncFolderPath}/${TEST_FILE_NAME}`;

    console.log('syncFolderPath', syncFolderPath);
    console.log('testFilePath', testFilePath);

    writeFileSync(testFilePath, TEST_FILE_CONTENT, 'utf-8');

    await waitForSyncStatus(electronApp, 'SYNCED', 90000);

    const fileStillExists = existsSync(testFilePath);

    pwExpect(fileStillExists).toBe(true);
  });

  it('should download a file from the cloud', async () => {
    await electronApp?.close();
    cleanupIsolatedStore();
    getIsolatedStore();

    electronApp = await launchElectronApp();

    const window = await getFirstWindow(electronApp);

    await triggerAndCompleteSSOLogin(electronApp, window, {
      email,
      password,
    });

    await assertLoggedIn(electronApp, email);

    const syncFolderPath = await getSyncFolderPath(electronApp);

    await waitForSyncStatus(electronApp, 'SYNCED', 180000);

    const testFilePath = `${syncFolderPath}/${TEST_FILE_NAME}`;

    const fileExists = existsSync(testFilePath);
    pwExpect(fileExists).toBe(true);

    const downloadedContent = readFileSync(testFilePath, 'utf-8');
    pwExpect(downloadedContent).toBe(TEST_FILE_CONTENT);
  });
});
