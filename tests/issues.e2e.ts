import { ElectronApplication, expect, Page, test } from '@playwright/test';
import {
  ipcMainCallFirstListener,
  ipcMainEmit,
} from 'electron-playwright-helpers';
import { _electron as electron } from 'playwright';

import AccessResponseFixtures from './fixtures/AccessResponse.json';
import {
  createBackupFatalError,
  createGeneralIssueFixture,
  createSyncError,
} from './fixtures/errors';
import { getWindowTopBarTitle } from './selectors';
import { wait } from './utils';
import { DEFAULT_LANGUAGE } from '../src/apps/shared/Locale/Language';
import { FatalError } from '../src/shared/issues/FatalError';
import { SyncError } from '../src/shared/issues/SyncErrorCause';
import { AppIssue } from '../src/shared/issues/AppIssue';

const activeTabSelector = 'button.text-neutral-500';
const tabSelector = (name: 'Sync' | 'Backups' | 'General') =>
  `button.text-m-neutral-80:has-text("${name}")`;
const emptyIssuesListSelector = 'p.text-xs.font-medium.text-m-neutral-60';

test.describe('process issues', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  const addSyncErrors = async (errors: Array<SyncError>) => {
    const emitEvents = errors
      .map(createSyncError)
      .map((error) => ipcMainEmit(electronApp, 'SYNC_INFO_UPDATE', error));

    return Promise.all(emitEvents);
  };

  const addBackupsErrors = async (
    errorsName: Array<FatalError>
  ): Promise<void> => {
    const errors = errorsName.map(createBackupFatalError);
    await ipcMainEmit(electronApp, 'add-backup-fatal-errors', errors);
  };

  const addGeneralIssues = async (issues: Array<AppIssue>) => {
    const eventsEmited = issues.map((issue) =>
      ipcMainEmit(electronApp, 'add-device-issue', issue)
    );

    await Promise.all(eventsEmited);
  };

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: ['release/app/dist/main/main.js'],
      env: {
        ...process.env,
        NODE_ENV: 'TEST',
      },
    });

    await ipcMainEmit(electronApp, 'user-logged-in', AccessResponseFixtures);
    await ipcMainCallFirstListener(electronApp, 'set-config-key', {
      key: 'preferedLanguage',
      value: DEFAULT_LANGUAGE,
    });

    await ipcMainCallFirstListener(electronApp, 'open-process-issues-window');

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
  });

  test.describe('sync issues', () => {
    test('tab selected is sync when there is any issue', async () => {
      const activeTab = await page.innerHTML(activeTabSelector);

      expect(activeTab).toBe('Sync');
    });

    test('issue is displayed', async () => {
      await addSyncErrors(['EMPTY_FILE']);
      const issue = await page.innerHTML('[data-test=sync-issue-name]');

      expect(issue).toContain('File is empty');
    });

    test('displays correct number of issues', async () => {
      const emitNErrors = 40;
      await addSyncErrors(
        Array.from({ length: emitNErrors }, () => 'EMPTY_FILE')
      );

      const numberOfIssues = await page.innerHTML(
        '[data-test=number-sync-issues]'
      );

      expect(numberOfIssues).toBe(`${emitNErrors} files`);
    });

    test('does not display any async issue is none is emitted', async () => {
      const list = await page.innerHTML(emptyIssuesListSelector);

      expect(list).toBeDefined();
      expect(list).toBe('No issues found');
    });

    // Commented because of https://github.com/internxt/drive-desktop/pull/230
    // allProcessErrorsName.forEach((error: ProcessErrorName) => {
    // 	test(`clicking on info icon brings ${error} info of the error`, async () => {
    // 		await addSyncErrors([error]);
    // 		await page.locator(infoCircleSelector).click();

    // 		await wait(200);
    // 		const errorDetails = await page.innerHTML('p.text-xs.text-gray-50');

    // 		expect(errorDetails).toContain(longMessages[error]);
    // 	});
    // });
  });

  test.describe('backups issues', () => {
    test('tab selected is backups when there is only backup issues', async () => {
      await addBackupsErrors(['NO_INTERNET']);
      await wait(1_000);
      const activeTab = await page.innerHTML(activeTabSelector);
      expect(activeTab).toBe('Backups');
    });

    test('the window can handle alot of errors', async () => {
      await addBackupsErrors(Array.from({ length: 1000 }, () => 'NO_INTERNET'));

      const activeTab = await page.innerHTML(activeTabSelector);
      expect(activeTab).toBe('Backups');
    });

    test('does not display any backups issue is none is emited', async () => {
      await page.locator(tabSelector('Backups')).click();
      await wait(200);

      const activeTab = await page.innerHTML(activeTabSelector);
      const list = await page.innerHTML(emptyIssuesListSelector);

      expect(activeTab).toBe('Backups');
      expect(list).toBeDefined();
      expect(list).toBe('No issues found');
    });
  });

  test.describe('general issues', () => {
    test('tab selected is general when there is only general issues', async () => {
      await addGeneralIssues([
        createGeneralIssueFixture('UNKNOWN_DEVICE_NAME'),
      ]);
      await wait(300);

      const activeTab = await page.innerHTML(activeTabSelector);

      expect(activeTab).toBe('General');
    });
  });
});
