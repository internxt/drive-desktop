import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { ipcMainEmit } from 'electron-playwright-helpers';
import { getWindowTopBarTitle } from './selectors';
import { createBackupFatalError } from './fixtures/backupFatalErrors';
import { ProcessFatalErrorName } from '../workers/types';

import AccessResponseFixtures from './fixtures/AccessResponse.json';

test.describe('process issues', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  const addBackupsErrors = async (
    errorsName: Array<ProcessFatalErrorName>
  ): Promise<void> => {
    const errors = errorsName.map(createBackupFatalError);
    await ipcMainEmit(electronApp, 'add-backup-fatal-errors', errors);
  };

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: ['release/app/dist/main/main.js'],
    });

    await ipcMainEmit(electronApp, 'user-logged-in', AccessResponseFixtures);

    await ipcMainEmit(electronApp, 'open-process-issues-window');
    page = await electronApp.firstWindow();
  });

  test.afterEach(() => {
    page.close();
  });

  test.describe('process issues window', () => {
    test('app is defined', () => {
      expect(electronApp).toBeDefined();
    });

    test('issues window opens', async () => {
      const topBarTitle = await getWindowTopBarTitle(page);
      expect(topBarTitle).toBe('Issues');
    });

    test.describe('backups issues', () => {
      test('tab selected is backups when there is only backup issues', async () => {
        await addBackupsErrors(['NO_INTERNET']);
        const activeTab = await page.innerHTML('button.text-neutral-500');
        expect(activeTab).toBe('Backups');
      });

      test('the window can handle alot of errors', async () => {
        await addBackupsErrors(
          Array.from({ length: 1000 }, () => 'NO_INTERNET')
        );

        const activeTab = await page.innerHTML('button.text-neutral-500');
        expect(activeTab).toBe('Backups');
      });
    });
  });
});
